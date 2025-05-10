import { format, isValid, parseISO, differenceInDays } from 'date-fns';
import axios from 'axios';

export async function getWeatherForecast(location: string, date: string): Promise<any> {
  try {
    const parsedDate = new Date(date);
    if (!isValid(parsedDate)) throw new Error(`Invalid date format: ${date}`);
    const formattedDate = format(parsedDate, 'yyyy-MM-dd');

    // 1. Get latitude & longitude for the location using Open-Meteo geocoding API
    const geoRes = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
      params: { name: location, count: 1 }
    });

    if (!geoRes.data.results || geoRes.data.results.length === 0) {
      throw new Error('Location not found. Please try a different city name.');
    }

    const { latitude, longitude, timezone, name, country } = geoRes.data.results[0];

    // 2. Fetch weather forecast with more detailed parameters
    const weatherRes = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude,
        longitude,
        daily: [
          'temperature_2m_max',
          'temperature_2m_min',
          'weathercode',
          'precipitation_probability_max',
          'windspeed_10m_max',
          'relative_humidity_2m_max'
        ].join(','),
        timezone,
        temperature_unit: 'fahrenheit',
        windspeed_unit: 'mph',
        forecast_days: 14
      }
    });

    const data = weatherRes.data;
    if (!data.daily || data.daily.time.length === 0) {
      throw new Error('No weather data available for the selected date');
    }

    // Find the nearest available date if the requested date is beyond the forecast range
    const dateIndex = data.daily.time.indexOf(formattedDate);
    let actualDate = formattedDate;
    let warning = undefined;

    if (dateIndex === -1) {
      // Find the nearest available date
      const dates = data.daily.time.map((d: string) => parseISO(d));
      const targetDate = parseISO(formattedDate);
      
      let nearestDate = dates[0];
      let minDiff = Math.abs(differenceInDays(targetDate, dates[0]));
      
      for (const date of dates) {
        const diff = Math.abs(differenceInDays(targetDate, date));
        if (diff < minDiff) {
          minDiff = diff;
          nearestDate = date;
        }
      }
      
      actualDate = format(nearestDate, 'yyyy-MM-dd');
      const newIndex = data.daily.time.indexOf(actualDate);
      
      warning = `Weather forecast for ${formattedDate} is not available. Showing forecast for nearest available date: ${format(nearestDate, 'MMMM d, yyyy')}`;
      
      return {
        location: `${name}, ${country}`,
        date: actualDate,
        requestedDate: formattedDate,
        temperature: data.daily.temperature_2m_max[newIndex],
        description: weatherCodeToDescription(data.daily.weathercode[newIndex]),
        icon: weatherCodeToIcon(data.daily.weathercode[newIndex]),
        details: {
          humidity: data.daily.relative_humidity_2m_max[newIndex],
          windSpeed: Math.round(data.daily.windspeed_10m_max[newIndex]),
          feelsLike: data.daily.temperature_2m_max[newIndex],
          precipitation: data.daily.precipitation_probability_max[newIndex]
        },
        warning
      };
    }

    return {
      location: `${name}, ${country}`,
      date: actualDate,
      requestedDate: formattedDate,
      temperature: data.daily.temperature_2m_max[dateIndex],
      description: weatherCodeToDescription(data.daily.weathercode[dateIndex]),
      icon: weatherCodeToIcon(data.daily.weathercode[dateIndex]),
      details: {
        humidity: data.daily.relative_humidity_2m_max[dateIndex],
        windSpeed: Math.round(data.daily.windspeed_10m_max[dateIndex]),
        feelsLike: data.daily.temperature_2m_max[dateIndex],
        precipitation: data.daily.precipitation_probability_max[dateIndex]
      }
    };
  } catch (error: any) {
    console.error('Weather service detailed error:', error);
    throw new Error(`Weather service error: ${error.message}`);
  }
}

function weatherCodeToDescription(code: number): string {
  const map: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Foggy with rime',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Light rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Light snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Light rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Light snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Thunderstorm with heavy hail'
  };
  return map[code] || 'Unknown';
}

function weatherCodeToIcon(code: number): string {
  const iconMap: Record<number, string> = {
    0: 'sun',
    1: 'sun',
    2: 'cloud-sun',
    3: 'cloud',
    45: 'cloud-fog',
    48: 'cloud-fog',
    51: 'cloud-drizzle',
    53: 'cloud-drizzle',
    55: 'cloud-drizzle',
    61: 'cloud-rain',
    63: 'cloud-rain',
    65: 'cloud-rain',
    71: 'cloud-snow',
    73: 'cloud-snow',
    75: 'cloud-snow',
    77: 'cloud-snow',
    80: 'cloud-rain',
    81: 'cloud-rain',
    82: 'cloud-rain',
    85: 'cloud-snow',
    86: 'cloud-snow',
    95: 'cloud-lightning',
    96: 'cloud-lightning',
    99: 'cloud-lightning'
  };
  return iconMap[code] || 'cloud';
}