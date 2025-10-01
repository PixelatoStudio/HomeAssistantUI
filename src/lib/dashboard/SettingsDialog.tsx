import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sun, Moon, Image, Upload } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const themeColors = [
  { name: 'Olive Green', value: '82 39% 45%', class: 'bg-[hsl(82,39%,45%)]' },
  { name: 'Blue', value: '217 91% 60%', class: 'bg-[hsl(217,91%,60%)]' },
  { name: 'Purple', value: '271 91% 65%', class: 'bg-[hsl(271,91%,65%)]' },
  { name: 'Pink', value: '330 81% 60%', class: 'bg-[hsl(330,81%,60%)]' },
  { name: 'Orange', value: '25 95% 53%', class: 'bg-[hsl(25,95%,53%)]' },
  { name: 'Red', value: '0 84% 60%', class: 'bg-[hsl(0,84%,60%)]' },
  { name: 'Teal', value: '173 80% 40%', class: 'bg-[hsl(173,80%,40%)]' },
  { name: 'Amber', value: '38 92% 50%', class: 'bg-[hsl(38,92%,50%)]' },
];

export function SettingsDialog({
  open,
  onOpenChange,
}: SettingsDialogProps) {
  const {
    theme,
    accentColor,
    showBackgroundImage,
    customBackgroundUrl,
    setTheme,
    setAccentColor,
    setShowBackgroundImage,
    setCustomBackgroundUrl,
  } = useSettingsStore();

  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    setImageUrl(customBackgroundUrl);
  }, [customBackgroundUrl]);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  const handleColorChange = (color: string) => {
    setAccentColor(color);
  };

  const handleImageUrlSubmit = () => {
    if (imageUrl.trim()) {
      setCustomBackgroundUrl(imageUrl.trim());
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setImageUrl(dataUrl);
        setCustomBackgroundUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Theme Mode */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Theme Mode</Label>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => handleThemeChange('light')}
                className={`flex-1 flex items-center gap-2 ${
                  theme === 'light' ? 'bg-accent hover:bg-accent/90 text-accent-foreground' : ''
                }`}
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => handleThemeChange('dark')}
                className={`flex-1 flex items-center gap-2 ${
                  theme === 'dark' ? 'bg-accent hover:bg-accent/90 text-accent-foreground' : ''
                }`}
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
            </div>
          </div>

          {/* Theme Color */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Accent Color</Label>
            <div className="grid grid-cols-4 gap-3">
              {themeColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorChange(color.value)}
                  className={`h-8 rounded-lg ${color.class} transition-all ${
                    accentColor === color.value
                      ? 'ring-2 ring-offset-2 ring-foreground scale-105'
                      : 'hover:scale-105'
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Background Image Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="background-toggle" className="text-sm font-semibold">
                Show Background Image
              </Label>
            </div>
            <Switch
              id="background-toggle"
              checked={showBackgroundImage}
              onCheckedChange={setShowBackgroundImage}
            />
          </div>

          {/* Custom Background Image */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Custom Background</Label>

            {/* File Upload */}
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                className="w-full flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Image
              </Button>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* URL Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Or enter image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleImageUrlSubmit()}
              />
              <Button
                onClick={handleImageUrlSubmit}
                size="sm"
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Apply
              </Button>
            </div>

            {customBackgroundUrl && (
              <p className="text-xs text-muted-foreground">
                Custom background active
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}