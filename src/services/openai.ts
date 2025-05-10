import OpenAI from 'openai';
import { format } from 'date-fns';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

interface ExtractedInfo {
  type: 'travel' | 'event' | 'lyrics' | 'movie' | 'anime' | 'sports' | 'culture';
  destination?: string;
  date?: string;
  event?: string;
  lyrics?: string;
  movie?: string;
  anime?: string;
  sports?: string;
  culture?: string;
}

export async function extractTravelInfo(message: string): Promise<ExtractedInfo> {
  const systemPrompt = `You are a fashion AI assistant. Extract one of the following: travel information, event type, song lyrics, movie/anime inspiration, sports fan theme, or cultural occasion from the user's message and return it in JSON format.

[...same as before...]
}`;

  if (!message.trim()) {
    throw new Error('Please provide a valid input');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ]
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('Please provide more details');
    }

    let result: ExtractedInfo;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Could not understand your request. Please try being more specific');
    }

    return result;
  } catch (error: any) {
    console.error('Error in extractTravelInfo:', error);
    throw new Error(error.message || 'Failed to process your request');
  }
}

export async function generateOutfitSuggestions(params: { weather?: any; event?: string; lyrics?: string; movie?: string; anime?: string; sports?: string; culture?: string }): Promise<any[]> {
  const { weather, event, lyrics, movie, anime, sports, culture } = params;
  let contextInput = '';

  if (weather) {
    const temp = Math.round(weather.temperature);
    const season = getSeason(new Date(weather.date));
    contextInput = `Design 4 fashion-forward outfits for ${weather.location}. Temperature: ${temp}°F (${getTemperatureCategory(temp)}), Condition: ${weather.description}, Season: ${season}.`;
  } else if (event) {
    contextInput = `Design 4 trend-aware outfits suitable for attending a ${event}.`;
  } else if (lyrics) {
    contextInput = `Design 4 outfits inspired by the emotion, tone, and imagery of the lyrics: \"${lyrics}\".`;
  } else if (movie) {
    contextInput = `Design 4 fashion looks inspired by the visual mood and style of the movie: \"${movie}\".`;
  } else if (anime) {
    contextInput = `Design 4 stylish outfits that channel the characters or aesthetic from the anime: \"${anime}\".`;
  } else if (sports) {
    contextInput = `Design 4 modern fan-inspired outfits for the occasion: \"${sports}\".`;
  } else if (culture) {
    contextInput = `Design 4 fashion outfits based on the cultural vibe of: \"${culture}\".`;
  } else {
    contextInput = `Design 4 versatile and stylish outfits based on recent fashion trends.`;
  }

  const prompt = `${contextInput}

Each outfit should include:
- A creative and fashionable name
- Clear description with labeled clothing items (Top, Bottom, Outerwear if needed, Shoes, Accessories)
- Include fabric, fit, and color details
- Add a searchQuery string and imagePrompt string

Format output as a valid JSON array of 4 objects. Each object must have:
{
  \"type\": \"Outfit Name\",
  \"description\": \"Top: ..., Bottom: ..., Shoes: ..., Accessories: ...\",
  \"searchQuery\": \"main item name\",
  \"imagePrompt\": \"descriptive image idea\"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a fashion-forward AI stylist trained on modern, edgy, and seasonal fashion trends. Respond with only a valid JSON array of 4 outfit objects.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = completion.choices[0].message.content;
    if (!content) return [];

    try {
      const jsonStart = content.indexOf('[');
      const jsonEnd = content.lastIndexOf(']') + 1;
      if (jsonStart < 0 || jsonEnd < 0) throw new Error('No JSON array found');
      const cleanedContent = content.substring(jsonStart, jsonEnd).replace(/,(\s*[}\]])/g, '$1');
      const outfits = JSON.parse(cleanedContent);
      return Array.isArray(outfits) ? outfits : [];
    } catch (error) {
      console.error('Parsing error:', error);
      return [];
    }
  } catch (error: any) {
    console.error('Error generating outfit suggestions:', error);
    return [];
  }
}

function getSeason(date: Date): string {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Fall';
  return 'Winter';
}

function getTemperatureCategory(temp: number): string {
  if (temp >= 85) return 'Very Hot';
  if (temp >= 75) return 'Hot';
  if (temp >= 65) return 'Warm';
  if (temp >= 55) return 'Mild';
  if (temp >= 45) return 'Cool';
  if (temp >= 35) return 'Cold';
  return 'Very Cold';
}
