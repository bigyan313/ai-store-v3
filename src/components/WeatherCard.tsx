import React from 'react';
import { Cloud, Droplets, Wind, Thermometer } from 'lucide-react';
import { WeatherData } from '../types';
import { format, parseISO } from 'date-fns';

interface WeatherCardProps {
  weather: WeatherData;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weather }) => {
  const date = typeof weather.date === 'string' ? parseISO(weather.date) : new Date(weather.date);
  const formattedDate = format(date, 'MMM d, yyyy');
  
  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden w-fit ml-auto">
      <div className="p-3 flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-light text-black">{Math.round(weather.temperature)}°</div>
          <div>
            <h3 className="font-light text-black text-sm">{weather.location}</h3>
            <p className="text-xs text-gray-600 font-light">{formattedDate}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs border-l border-gray-100 pl-4">
          <div className="flex items-center gap-1">
            <Thermometer className="h-3 w-3 text-red-500" />
            <span className="text-gray-600 font-light">Feels</span>
            <span className="font-light text-black">{Math.round(weather.details.feelsLike)}°</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Droplets className="h-3 w-3 text-blue-500" />
            <span className="text-gray-600 font-light">{weather.details.humidity}%</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Wind className="h-3 w-3 text-cyan-500" />
            <span className="font-light text-black">{weather.details.windSpeed} mph</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;