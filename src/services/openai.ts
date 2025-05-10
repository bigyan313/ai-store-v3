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

  const schema = `Return JSON with the following keys (omit keys not present):

- inspirationType: one of [\"travel\",\"event\",\"lyrics\",\"movie\",\"anime\",\"sports\",\"culture\",\"weather\"]
- location: city / state / country
- date: ISO-8601 (yyyy-mm-dd)
- event: if inspirationType=event
- celebration: holiday / celebration (e.g. Halloween)
- theme: style or vibe keywords (e.g. rave, formal)
- weatherDescription: user-mentioned weather words (rainy, sunny …)
- temperature: number in °F
- referencedWork: title of song / movie / anime or sports team
- originalQuery: copy of the user message

Only output JSON.`;

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

// Back‑compat shim so existing code using extractTravelInfo keeps working.
// It simply proxies to the new function.
export const extractTravelInfo = parseOutfitPrompt;
