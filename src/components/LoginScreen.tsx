import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Key, Server, Info } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, error } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url || !token) {
      return;
    }

    setLoading(true);

    const success = await login(url, token);

    if (success) {
      onLogin();
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="glass-card w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-accent/10">
              <Home className="h-8 w-8 text-accent" />
            </div>
          </div>
          <h1 className="text-2xl font-montserrat font-semibold">Home Assistant</h1>
          <p className="text-muted-foreground">Connect to your Home Assistant instance</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Home Assistant URL
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="http://homeassistant.local:8123"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="token" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Long-Lived Access Token
            </Label>
            <Input
              id="token"
              type="password"
              placeholder="Enter your access token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={loading}
              className="w-full"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Connecting..." : "Connect"}
          </Button>
        </form>

        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">How to get your access token:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Go to your Home Assistant profile</li>
                <li>Scroll down to "Long-Lived Access Tokens"</li>
                <li>Click "Create Token"</li>
                <li>Give it a name and copy the token</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}