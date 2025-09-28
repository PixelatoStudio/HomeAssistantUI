import { Cloud, CloudRain, Sun, Wind, MapPin, Droplets } from "lucide-react";

interface WeatherCardProps {
  location: string;
  temperature: number;
  condition: "sunny" | "cloudy" | "rainy";
  humidity: number;
  windSpeed: number;
}

export function WeatherCard({ location, temperature, condition, humidity, windSpeed }: WeatherCardProps) {
  const getWeatherIcon = () => {
    switch (condition) {
      case 'sunny':
        return <Sun className="h-6 w-6 text-yellow-500" />;
      case 'cloudy':
        return <Cloud className="h-6 w-6 text-gray-500" />;
      case 'rainy':
        return <CloudRain className="h-6 w-6 text-blue-500" />;
      default:
        return <Sun className="h-6 w-6 text-yellow-500" />;
    }
  };

  return (
    <div className="device-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
          <MapPin className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">Weather</h3>
          <p className="text-xs text-muted-foreground truncate">{location}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getWeatherIcon()}
          <div>
            <div className="text-xl font-bold gradient-text">{temperature}°C</div>
            <div className="text-xs text-muted-foreground capitalize">{condition}</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <Droplets className="h-3 w-3 text-blue-500" />
          <span className="text-muted-foreground">{humidity}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Wind className="h-3 w-3 text-gray-500" />
          <span className="text-muted-foreground">{windSpeed} km/h</span>
        </div>
      </div>
    </div>
  );
}