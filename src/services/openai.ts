import OpenAI from 'openai';
import { format } from 'date-fns';

/**
 * Centralised OpenAI service for parsing *any* style‑related prompt and returning
 * high‑quality outfit suggestions: travel, events, pop‑culture references,
 * seasons, celebrity fits, trends, activities (hiking, gym), etc.
 *
 * ▸ extractOutfitContext  ➜  Classifies the user prompt and pulls out key info
 * ▸ generateOutfitSuggestions ➜ Returns four fully‑fledged outfits in strict JSON.
 * ▸ *Alias* extractTravelInfo maintained for backwards compatibility.
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
    | 'travel'    // Location + date supplied
    | 'event'     // Weddings, parties, graduations …
    | 'lyrics'    // Specific song or lyric line
    | 'movie'     // Film / TV reference
    | 'anime'     // Anime / manga
    | 'sports'    // Fan‑wear / game day
    | 'culture'   // Holiday, festival, seasonal tradition
    | 'season'    // "Summer", "Winter", "Spring layers" …
    | 'celebrity' // "Rihanna Super Bowl outfit", "Harry Styles tour fit" …
    | 'trend'     // "Quiet luxury", "Gorpcore" …
    | 'theme'     // "Bohemian", "Business casual", "Street goth" …
    | 'activity'  // "Hiking", "Mountain trek", "Gym session" …
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
  season?: string;
  celebrity?: string;
  trend?: string;
  theme?: string;
  activity?: string;
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
Return a *single* JSON object classifying the user's request.

Allowed keys: type (string, required), destination, date (yyyy-MM-dd), event, lyrics, movie, anime, sports, culture, season, celebrity, trend, theme, activity.

If nothing matches, set {"type":"generic"}.
Return *only* raw JSON — no markdown, code fences, or additional text.`;

const suggestionSystemPrompt =
  'You are an avant‑garde stylist trained on global fashion week trends, technical activewear, streetwear blogs, luxury look‑books and climate data. Respond with *only* a JSON array (length 4) — no markdown.';

// -----------------------------------------------------------------------------
// extractOutfitContext ---------------------------------------------------------
// -----------------------------------------------------------------------------

async function extractTravelInfo(message: string): Promise<OutfitContext> {
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
    throw new Error('Could not understand your request — please refine the details.');
  }
}

// // Maintain legacy export so existing codebases keep working
 export { extractTravelInfo };

// -----------------------------------------------------------------------------
// generateOutfitSuggestions ----------------------------------------------------
// -----------------------------------------------------------------------------

export async function generateOutfitSuggestions(params: Partial<OutfitContext> & { weather?: WeatherInfo }): Promise<OutfitSuggestion[]> {
  const { weather, event, lyrics, movie, anime, sports, culture, destination, date, season, celebrity, trend, theme, activity } = params;

  /* ---------------------------------- Context string --------------------------------- */
  const context: string = (() => {
    if (weather) {
      const temp = Math.round(weather.temperature);
      return `Design 4 fashion‑forward outfits for ${weather.location}. Temp: ${temp}°F (${getTempCat(temp)}), Condition: ${weather.description}.`;
    }
    if (event)      return `Design 4 stylish outfits suitable for a ${event}.`;
    if (lyrics)     return `Design 4 expressive outfits inspired by these lyrics: "${lyrics}".`;
    if (movie)      return `Design 4 modern looks echoing the aesthetic of "${movie}".`;
    if (anime)      return `Design 4 stylish outfits channeling the characters / art style of "${anime}".`;
    if (sports)     return `Design 4 fan‑centric outfits for the ${sports} occasion.`;
    if (culture)    return `Design 4 culturally resonant outfits for "${culture}".`;
    if (season)     return `Design 4 must‑have outfits perfect for ${season} season.`;
    if (celebrity)  return `Design 4 outfits that capture ${celebrity}'s signature style.`;
    if (trend)      return `Design 4 outfits embodying the "${trend}" trend.`;
    if (theme)      return `Design 4 outfits built around a "${theme}" theme.`;
    if (activity)   return `Design 4 performance‑ready outfits tailored for ${activity}.`;
    if (destination) {
      const day = date ? format(new Date(date), 'PP') : 'an upcoming trip';
      return `Design 4 versatile travel outfits for ${destination} on ${day}.`;
    }
    return 'Design 4 globally inspired outfits following current fashion trends.';
  })();

  /* ---------------------------------- Full prompt ------------------------------------ */
  const prompt = `${context}

Each outfit must include:\n- "type": catchy outfit name\n- "description": labelled items (Top, Bottom, Outerwear if required, Shoes, Accessories) with colour, fabric & fit details\n- "searchQuery": an e‑commerce friendly keyword\n- "imagePrompt": a concise descriptive image generation prompt`;

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

function getTempCat(t: number): string {
  if (t >= 90) return 'Scorching';
  if (t >= 80) return 'Very Hot';
  if (t >= 70) return 'Hot';
  if (t >= 60) return 'Warm';
  if (t >= 50) return 'Mild';
  if (t >= 40) return 'Cool';
  if (t >= 32) return 'Cold';
  return 'Freezing';
}
