import OpenAI from 'openai';
import { format } from 'date-fns';

/**
 * Centralised OpenAI service for parsing any style–related prompt (travel, events,
 * pop‑culture references, generic fashion questions, etc.) and returning
 * high‑quality outfit suggestions.
 *
 * ▸ extractOutfitContext  ➜  Classifies the user prompt and pulls out key info
 * ▸ generateOutfitSuggestions ➜ Returns four fully‑fledged outfits in strict JSON.
 */

// -----------------------------------------------------------------------------
// Initialise ------------------------------------------------------------------
// -----------------------------------------------------------------------------

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Prefer a modern model, but allow fallback via env var
const DEFAULT_MODEL = import.meta.env.VITE_OPENAI_MODEL ?? 'gpt-4o-mini';

// -----------------------------------------------------------------------------
// Types -----------------------------------------------------------------------
// -----------------------------------------------------------------------------

export interface OutfitContext {
  /** Primary inspiration driver */
  type:
    | 'travel'  // Location + date supplied
    | 'event'   // Weddings, parties, photo‑shoots …
    | 'lyrics'  // Specific song or lyric line
    | 'movie'   // Film / TV reference
    | 'anime'   // Anime / manga
    | 'sports'  // Game day / jersey colours …
    | 'culture' // Holiday, festival, seasonal tradition
    | 'generic';
  /* Optional extracted fields (only the ones relevant to `type` will be set) */
  destination?: string;
  date?: string;           // ISO yyyy‑MM‑dd
  event?: string;
  lyrics?: string;
  movie?: string;
  anime?: string;
  sports?: string;
  culture?: string;
}

export interface WeatherInfo {
  date: string;           // yyyy‑MM‑dd
  location: string;
  temperature: number;    // °F
  description: string;    // "Sunny", "Rain showers" …
}

export interface OutfitSuggestion {
  type: string;
  description: string;
  searchQuery: string;
  imagePrompt: string;
}

// -----------------------------------------------------------------------------
// Prompt helpers --------------------------------------------------------------
// -----------------------------------------------------------------------------

const extractionSystemPrompt = `You are a senior fashion‑tech parser.
Return a *single* JSON object that classifies the user's request.

Allowed keys: type (string, required with one of the accepted values),
destination, date (yyyy-MM-dd), event, lyrics, movie, anime, sports, culture.

If nothing matches, set {"type":"generic"}.
Return *only* raw JSON — no markdown, code fences, nor additional text.`;

const suggestionSystemPrompt =
  'You are an avant‑garde stylist trained on global fashion week trends, streetwear blogs, luxury look‑books and climate data.  Respond with *only* a JSON array (length 4) — no markdown.';

// -----------------------------------------------------------------------------
// extractOutfitContext ---------------------------------------------------------
// -----------------------------------------------------------------------------

export async function extractOutfitContext(message: string): Promise<OutfitContext> {
  if (!message.trim()) throw new Error('Please provide a non‑empty prompt.');

  const { choices } = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: extractionSystemPrompt },
      { role: 'user', content: message }
    ]
  });

  const json = choices[0].message.content;
  try {
    return JSON.parse(json) as OutfitContext;
  } catch (err) {
    console.error('🟥 Context‑parse error', json);
    throw new Error('Could not understand your request — please refine the details.');
  }
}

// -----------------------------------------------------------------------------
// generateOutfitSuggestions ----------------------------------------------------
// -----------------------------------------------------------------------------

export async function generateOutfitSuggestions(params: Partial<OutfitContext> & { weather?: WeatherInfo }): Promise<OutfitSuggestion[]> {
  const { weather, event, lyrics, movie, anime, sports, culture, destination, date } = params;

  /* ---------------------------------- Context string --------------------------------- */
  const context: string = (() => {
    if (weather) {
      const temp = Math.round(weather.temperature);
      return `Design 4 fashion‑forward outfits for ${weather.location}. Temperature: ${temp}°F (${getTemperatureCategory(temp)}), Condition: ${weather.description}.`;
    }
    if (event)   return `Design 4 on‑trend outfits suitable for a ${event}.`;
    if (lyrics)  return `Design 4 expressive outfits inspired by the vibe of these lyrics: "${lyrics}".`;
    if (movie)   return `Design 4 modern looks echoing the aesthetic of "${movie}".`;
    if (anime)   return `Design 4 stylish outfits channeling the characters / art style of "${anime}".`;
    if (sports)  return `Design 4 fan‑centric outfits for the ${sports} occasion.`;
    if (culture) return `Design 4 culturally resonant outfits for "${culture}".`;
    if (destination) {
      const day = date ? format(new Date(date), 'PP') : 'an upcoming trip';
      return `Design 4 versatile travel outfits for ${destination} on ${day}.`;
    }
    return 'Design 4 globally inspired outfits following current fashion trends.';
  })();

  /* ---------------------------------- Full prompt ------------------------------------ */
  const prompt = `${context}

Each outfit must include:\n- "type": a catchy outfit name\n- "description": labelled items (Top, Bottom, Outerwear if required, Shoes, Accessories) with colour, fabric & fit details\n- "searchQuery": an e‑commerce friendly keyword\n- "imagePrompt": a concise descriptive image generation prompt`;

  const { choices } = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: suggestionSystemPrompt },
      { role: 'user', content: prompt }
    ]
  });

  const raw = choices[0].message.content;
  try {
    const outfits = JSON.parse(raw) as OutfitSuggestion[];
    return Array.isArray(outfits) ? outfits : [];
  } catch (err) {
    console.error('🟥 Outfit‑parse error', raw);
    return [];
  }
}

// -----------------------------------------------------------------------------
// Helpers ---------------------------------------------------------------------
// -----------------------------------------------------------------------------

function getTemperatureCategory(temp: number): string {
  if (temp >= 90) return 'Scorching';
  if (temp >= 80) return 'Very Hot';
  if (temp >= 70) return 'Hot';
  if (temp >= 60) return 'Warm';
  if (temp >= 50) return 'Mild';
  if (temp >= 40) return 'Cool';
  if (temp >= 32) return 'Cold';
  return 'Freezing';
}
