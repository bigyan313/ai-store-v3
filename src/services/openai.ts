/*
 * Enhanced OpenAI service for extracting context and generating highly accurate outfit suggestions.
 * Keeps legacy export signatures intact while adding broader input support and stronger JSON guarantees.
 */

import OpenAI from 'openai';
import { format } from 'date-fns';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

/**
 * Raw categories we try to identify from free‑form user input.
 */
export interface ExtractedInfo {
  type:
    | 'travel'
    | 'event'
    | 'lyrics'
    | 'movie'
    | 'anime'
    | 'sports'
    | 'culture'
    | 'activity'; // e.g. hiking, gym, mountain trek
  // optional granular details
  destination?: string;
  date?: string; // ISO formatted if supplied or inferred (yyyy‑MM‑dd)
  event?: string;
  lyrics?: string;
  movie?: string;
  anime?: string;
  sports?: string;
  culture?: string;
  activity?: string;
  location?: string; // extracted city/region if any
  raw?: string; // original user message for downstream reference
}

/**
 * Choose the best available model. 4‑o‑mini is preferred for speed/cost, falling back to 3.5 if unavailable.
 */
function selectModel(): string {
  const preferred = 'gpt-4o-mini';
  const fallback = 'gpt-3.5-turbo';
  try {
    // @ts-ignore – at runtime the SDK will throw if model unknown; we just return string here
    return preferred;
  } catch {
    return fallback;
  }
}

/**
 * Extract structured intent from the user message.
 */
export async function extractTravelInfo(message: string): Promise<ExtractedInfo> {
  if (!message.trim()) throw new Error('Please provide a valid input');

  const systemPrompt = `You are an AI fashion assistant. Identify the *primary* fashion‑relevant context from the user message and reply **only** with a minified JSON object following this exact schema:
  {
    "type": "travel | event | lyrics | movie | anime | sports | culture | activity",
    // include exactly ONE matching field below based on type
    "destination"?: string,
    "date"?: string,      // if a date is present or implied (ISO 8601 yyyy-MM-dd)
    "event"?: string,
    "lyrics"?: string,
    "movie"?: string,
    "anime"?: string,
    "sports"?: string,
    "culture"?: string,
    "activity"?: string,
    "location"?: string   // city/region if detected separate from destination
  }
  • Always pick the *single* most relevant type.
  • Do not wrap the JSON in markdown or extra text.
  • If nothing fits, respond with {"type":"event","event":"general"}`;

  const completion = await openai.chat.completions.create({
    model: selectModel(),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ],
  });

  const content = completion.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Could not understand your request. Please add more detail.');

  try {
    const parsed = JSON.parse(content) as ExtractedInfo;
    return { ...parsed, raw: message };
  } catch (err) {
    console.error('Failed to parse OpenAI response:', content);
    throw new Error('Internal parsing error; please rephrase your request.');
  }
}

/**
 * Determine season from a given date.
 */
function getSeason(date: Date): string {
  const m = date.getMonth();
  return m < 2 || m === 11
    ? 'Winter'
    : m < 5
    ? 'Spring'
    : m < 8
    ? 'Summer'
    : 'Fall';
}

function getTemperatureCategory(tempF: number): string {
  if (tempF >= 95) return 'Extreme Heat';
  if (tempF >= 85) return 'Very Hot';
  if (tempF >= 75) return 'Hot';
  if (tempF >= 65) return 'Warm';
  if (tempF >= 55) return 'Mild';
  if (tempF >= 45) return 'Cool';
  if (tempF >= 35) return 'Cold';
  return 'Freezing';
}

interface SuggestionParams {
  weather?: {
    date: Date | string;
    temperature: number; // °F
    description: string; // eg. "Clear", "Rain"
    location: string;
  };
  event?: string;
  lyrics?: string;
  movie?: string;
  anime?: string;
  sports?: string;
  culture?: string;
  activity?: string;
}

/**
 * Generate four rich outfit suggestions.
 */
export async function generateOutfitSuggestions(params: SuggestionParams): Promise<any[]> {
  const { weather, event, lyrics, movie, anime, sports, culture, activity } = params;

  // Build dynamic context prompt
  let contextInput = '';
  if (weather) {
    const temp = Math.round(weather.temperature);
    const season = typeof weather.date === 'string' ? getSeason(new Date(weather.date)) : getSeason(weather.date);
    contextInput = `Design 4 fashion‑forward outfits for ${weather.location}. Temperature: ${temp}°F (${getTemperatureCategory(temp)}), Condition: ${weather.description}, Season: ${season}.`;
  } else if (activity) {
    contextInput = `Design 4 functional yet stylish outfits suitable for ${activity}. Focus on performance fabrics, comfort, and aesthetic appeal.`;
  } else if (event) {
    contextInput = `Design 4 trend‑aware outfits suitable for attending a ${event}.`;
  } else if (lyrics) {
    contextInput = `Design 4 outfits inspired by the emotion, tone, and imagery of the lyrics: \"${lyrics}\".`;
  } else if (movie) {
    contextInput = `Design 4 fashion looks inspired by the visual mood and style of the movie \"${movie}\".`;
  } else if (anime) {
    contextInput = `Design 4 stylish outfits that channel the characters or aesthetic from the anime \"${anime}\".`;
  } else if (sports) {
    contextInput = `Design 4 modern fan‑inspired outfits for the occasion: \"${sports}\".`;
  } else if (culture) {
    contextInput = `Design 4 fashion outfits based on the cultural vibe of \"${culture}\".`;
  } else {
    contextInput = 'Design 4 versatile and stylish outfits based on cutting‑edge fashion trends.';
  }

  const generationPrompt = `${contextInput}

Return ONLY a valid JSON array of FOUR objects; each object must match this schema (no markdown):
{
  "type": string,               // creative outfit title
  "description": string,        // Top: ..., Bottom: ..., Shoes: ..., Accessories: ... (one line per item)
  "searchQuery": string,        // a short query we can pass to CSE for key item
  "imagePrompt": string         // vivid DALLE/Unsplash‑style prompt describing scene & outfit
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: selectModel(),
      messages: [
        {
          role: 'system',
          content: 'You are a cutting‑edge AI stylist specialised in merging practicality with high fashion. Respond only with raw JSON as specified.',
        },
        { role: 'user', content: generationPrompt },
      ],
      temperature: 0.9,
    });

    const content = completion.choices?.[0]?.message?.content?.trim();
    if (!content) return [];

    // Attempt strict JSON parsing – strip any leading code fences or text.
    const firstBracket = content.indexOf('[');
    const lastBracket = content.lastIndexOf(']');
    if (firstBracket === -1 || lastBracket === -1) throw new Error('No JSON array found');
    const rawJson = content.slice(firstBracket, lastBracket + 1);
    return JSON.parse(rawJson);
  } catch (err) {
    console.error('Error generating outfit suggestions:', err);
    return [];
  }
}
