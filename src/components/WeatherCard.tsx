import { Cloud, CloudRain, Sun, Wind, MapPin, Droplets, Snowflake, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface WeatherForecast {
  datetime: string;
  condition: string;
  temperature?: number;
  templow?: number;
  precipitation?: number;
  wind_speed?: number;
}

interface WeatherCardProps {
  location?: string;
  temperature?: number;
  condition?: string;
  humidity?: number;
  windSpeed?: number;
  forecast?: WeatherForecast[];
}

export function WeatherCard({ location, temperature, condition, humidity, windSpeed, forecast }: WeatherCardProps) {
  const [showForecast, setShowForecast] = useState(false);
  const getWeatherIcon = () => {
    const lowerCondition = condition?.toLowerCase() || '';

    if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
      return <Sun className="h-6 w-6 text-muted-foreground" />;
    } else if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
      return <Cloud className="h-6 w-6 text-muted-foreground" />;
    } else if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
      return <CloudRain className="h-6 w-6 text-muted-foreground" />;
    } else if (lowerCondition.includes('snow') || lowerCondition.includes('blizzard')) {
      return <Snowflake className="h-6 w-6 text-muted-foreground" />;
    } else if (lowerCondition.includes('thunder') || lowerCondition.includes('storm')) {
      return <Zap className="h-6 w-6 text-muted-foreground" />;
    } else {
      return <Sun className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getWeatherIconForCondition = (condition: string) => {
    const lowerCondition = condition?.toLowerCase() || '';

    if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
      return <Sun className="h-4 w-4 text-muted-foreground" />;
    } else if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
      return <Cloud className="h-4 w-4 text-muted-foreground" />;
    } else if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
      return <CloudRain className="h-4 w-4 text-muted-foreground" />;
    } else if (lowerCondition.includes('snow') || lowerCondition.includes('blizzard')) {
      return <Snowflake className="h-4 w-4 text-muted-foreground" />;
    } else if (lowerCondition.includes('thunder') || lowerCondition.includes('storm')) {
      return <Zap className="h-4 w-4 text-muted-foreground" />;
    } else {
      return <Sun className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="device-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-muted">
          <MapPin className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">Weather</h3>
          <p className="text-xs text-muted-foreground truncate">{location || 'Unknown Location'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getWeatherIcon()}
          <div>
            <div className="text-xl font-bold text-accent">
              {temperature !== undefined ? `${Math.round(temperature)}°F` : '--°F'}
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {condition || 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <Droplets className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">
            {humidity !== undefined ? `${Math.round(humidity)}%` : '--%'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Wind className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">
            {windSpeed !== undefined ? `${Math.round(windSpeed)} mph` : '-- mph'}
          </span>
        </div>
      </div>

      {/* Forecast Section */}
      {forecast && forecast.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <button
            onClick={() => setShowForecast(!showForecast)}
            className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-accent transition-colors"
          >
            <span>{forecast.length}-Day Forecast</span>
            {showForecast ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showForecast && (
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
              {forecast.slice(0, 10).map((day, index) => (
                <div key={index} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 flex-1">
                    {getWeatherIconForCondition(day.condition)}
                    <span className="text-xs font-medium min-w-0 flex-1">
                      {index === 0 ? 'Today' : formatDate(day.datetime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground capitalize">
                      {day.condition}
                    </span>
                    <span className="font-medium min-w-[3rem] text-right">
                      {day.temperature !== undefined ? `${Math.round(day.temperature)}°` : '--°'}
                      {day.templow !== undefined && (
                        <span className="text-muted-foreground ml-1">
                          / {Math.round(day.templow)}°
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}