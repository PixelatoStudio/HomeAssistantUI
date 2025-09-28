import { Cloud, CloudRain, Sun, Wind } from "lucide-react";

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
      case "sunny":
        return <Sun className="h-8 w-8 text-yellow-500" />;
      case "cloudy":
        return <Cloud className="h-8 w-8 text-gray-500" />;
      case "rainy":
        return <CloudRain className="h-8 w-8 text-blue-500" />;
      default:
        return <Sun className="h-8 w-8 text-yellow-500" />;
    }
  };

  return (
    <div className="device-card col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Weather</h3>
          <p className="text-xs text-muted-foreground">{location}</p>
        </div>
        {getWeatherIcon()}
      </div>
      
      <div className="flex items-end gap-2 mb-4">
        <span className="text-3xl font-bold gradient-text">{temperature}</span>
        <span className="text-sm text-muted-foreground mb-1">°C</span>
        <span className="text-sm text-muted-foreground mb-1 ml-2 capitalize">{condition}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-muted-foreground">Humidity</span>
          <span className="font-medium">{humidity}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Wind</span>
          <span className="font-medium">{windSpeed} km/h</span>
        </div>
      </div>
    </div>
  );
}