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
        return <Sun className="h-6 w-6 text-muted-foreground" />;
      case 'cloudy':
        return <Cloud className="h-6 w-6 text-muted-foreground" />;
      case 'rainy':
        return <CloudRain className="h-6 w-6 text-muted-foreground" />;
      default:
        return <Sun className="h-6 w-6 text-muted-foreground" />;
    }
  };

  return (
    <div className="device-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-muted">
          <MapPin className="h-5 w-5 text-muted-foreground" />
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
            <div className="text-xl font-bold text-accent">{temperature}°C</div>
            <div className="text-xs text-muted-foreground capitalize">{condition}</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <Droplets className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">{humidity}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Wind className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">{windSpeed} km/h</span>
        </div>
      </div>
    </div>
  );
}