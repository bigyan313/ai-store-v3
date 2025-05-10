import OpenAI, { ClientOptions } from 'openai';
import { format, parseISO, isValid } from 'date-fns';

// ---------------------------------------------------------------------------
//  OpenAI client setup
// ---------------------------------------------------------------------------

const MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
} as ClientOptions);

// ---------------------------------------------------------------------------
//  Type definitions
// ---------------------------------------------------------------------------

export interface OutfitContext {
  /** One of the primary inspiration buckets */
  inspirationType:
    | 'travel'
    | 'event'
    | 'lyrics'
    | 'movie'
    | 'anime'
    | 'sports'
    | 'culture'
    | 'weather';
  /** “Paris, France” | “Tokyo” etc. */
  location?: string;
  /** ISO‑8601 date if mentioned or implied */
  date?: string;
  /** Specific event, e.g. “wedding” */
  event?: string;
  /** Holiday or celebration, e.g. “Halloween” */
  celebration?: string;
  /** Style modifiers: “rave”, “business casual”, … */
  theme?: string;
  /** Weather words from prompt: “rainy”, “sunny”, … */
  weatherDescription?: string;
  /** Numeric temp (°F) if stated */
  temperature?: number;
  /** Title of referenced work or sports team */
  referencedWork?: string;
  /** Original user query */
  originalQuery: string;
}

export interface OutfitDesign {
  /** Catchy outfit name */
  type: string;
  /** Labeled item breakdown */
  description: string;
  /** Hero item query for shopping */
  searchQuery: string;
  /** Prompt for image generation */
  imagePrompt: string;
}

// ---------------------------------------------------------------------------
//  1️⃣  Parse user prompt into structured context
// ---------------------------------------------------------------------------

export async function parseOutfitPrompt(message: string): Promise<OutfitContext> {
  if (!message.trim()) throw new Error('Please provide a valid input');

  const schema = `Return JSON with the following keys (omit keys not present):\n\n- inspirationType: one of [\"travel\",\"event\",\"lyrics\",\"movie\",\"anime\",\"sports\",\"culture\",\"weather\"]\n- location: city / state / country\n- date: ISO‑8601 (yyyy-mm-dd)\n- event: if inspirationType=event\n- celebration: holiday / celebration (e.g. Halloween)\n- theme: style or vibe keywords (e.g. rave, formal)\n- weatherDescription: user‑mentioned weather words (rainy, sunny …)\n- temperature: number in °F\n- referencedWork: title of song / movie / anime or sports team\n- originalQuery: copy of the user message\n\nOnly output JSON.`;

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: schema },
        { role: 'user', content: message },
      ],
    });

    const raw = completion.choices[0].message?.content;
    if (!raw) throw new Error('Empty response from OpenAI');

    const parsed: OutfitContext = JSON.parse(raw);
    parsed.originalQuery = message;
    return parsed;
  } catch (err: any) {
    console.error('parseOutfitPrompt error:', err);
    throw new Error(err.message || 'Unable to understand your request');
  }
}

// ---------------------------------------------------------------------------
//  2️⃣  Generate outfit designs from structured context
// ---------------------------------------------------------------------------

interface WeatherInfo {
  location: string;
  date: string; // ISO
  temperature: number;
  description: string;
}

interface GenerateOptions {
  context: OutfitContext;
  weather?: WeatherInfo;
  count?: number; // default 4
}

export async function generateOutfitSuggestions({ context, weather, count = 4 }: GenerateOptions): Promise<OutfitDesign[]> {
  let contextInput = '';

  if (weather && isValid(parseISO(weather.date))) {
    const season = getSeason(parseISO(weather.date));
    contextInput = `Design ${count} fashion‑forward outfits for ${weather.location} on ${format(parseISO(weather.date), 'MMMM do, yyyy')}. Temperature: ${weather.temperature}°F (${getTemperatureCategory(weather.temperature)}), Weather: ${weather.description}, Season: ${season}.`;
  } else {
    switch (context.inspirationType) {
      case 'event':
        contextInput = `Design ${count} trend‑aware outfits suitable for ${context.event ?? 'an event'}${context.theme ? ` with a ${context.theme} theme` : ''}.`;
        break;
      case 'travel':
        contextInput = `Design ${count} stylish outfits for traveling to ${context.location ?? 'a destination'}${context.theme ? `, vibe: ${context.theme}` : ''}.`;
        break;
      case 'lyrics':
      case 'movie':
      case 'anime':
      case 'sports':
        contextInput = `Design ${count} outfits inspired by ${context.referencedWork ?? 'the referenced work'}.`;
        break;
      case 'culture':
        contextInput = `Design ${count} outfits reflecting the spirit of ${context.celebration ?? 'the cultural occasion'}.`;
        break;
      case 'weather':
        contextInput = `Design ${count} weather‑appropriate outfits for a ${context.weatherDescription ?? ''} day around ${context.temperature ? context.temperature + '°F' : 'unknown temperature'}.`;
        break;
      default:
        contextInput = `Design ${count} versatile and stylish outfits based on current fashion trends.`;
    }
  }

  const designPrompt = `${contextInput}\n\nFor each outfit include:\n- \"type\": catchy outfit name (max 5 words)\n- \"description\": labeled clothing items (Top, Bottom, Outerwear, Shoes, Accessories) with fabric/color/fit details\n- \"searchQuery\": concise hero item search term (avoid specific brands unless essential)\n- \"imagePrompt\": imaginative prompt for generating an editorial‑style image\n\nRespond ONLY with a valid JSON array containing exactly ${count} objects.`;

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a seasoned fashion stylist with deep knowledge of contemporary, streetwear, luxury and heritage trends.'
        },
        {
          role: 'user',
          content: designPrompt,
        },
      ],
    });

    const raw = completion.choices[0].message?.content;
    if (!raw) return [];

    const outfits: OutfitDesign[] = JSON.parse(raw);
    return Array.isArray(outfits) ? outfits : [];
  } catch (error) {
    console.error('generateOutfitSuggestions error:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------

function getSeason(date: Date): string {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Fall';
  return 'Winter';
}

function getTemperatureCategory(temp: number): string {
  if (temp >= 95) return 'Extreme Heat';
  if (temp >= 85) return 'Very Hot';
  if (temp >= 75) return 'Hot';
  if (temp >= 65) return 'Warm';
  if (temp >= 55) return 'Mild';
  if (temp >= 45) return 'Cool';
  if (temp >= 35) return 'Cold';
  return 'Freezing';
}
