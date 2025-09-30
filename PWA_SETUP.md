# PWA Setup Guide

## What Was Added

Your Home Assistant dashboard now supports Progressive Web App (PWA) installation, allowing users to install it as a native-looking app on tablets and phones.

## Files Added/Modified

### New Files:
- `public/manifest.json` - PWA manifest with app metadata
- `public/icon-192.png` - App icon (192x192)
- `public/icon-512.png` - App icon (512x512)
- `public/icon-192.svg` - Vector icon source
- `public/icon-512.svg` - Vector icon source
- `PWA_SETUP.md` - This guide

### Modified Files:
- `vite.config.ts` - Added VitePWA plugin configuration
- `index.html` - Added PWA meta tags and manifest link
- `package.json` - Added vite-plugin-pwa dependency

## How to Install on Devices

### iPad/iPhone (Safari Required):
1. Open Safari browser
2. Navigate to: `http://homeassistant.local:3001` (or your server IP)
3. Tap the Share button (square with arrow up)
4. Scroll down and tap "Add to Home Screen"
5. Tap "Add"
6. App icon appears on home screen

### Android Tablet/Phone:
1. Open Chrome (or any browser)
2. Navigate to your dashboard URL
3. Tap the menu (⋮) or look for install prompt
4. Tap "Install app" or "Add to Home screen"
5. Tap "Install"
6. App icon appears in app drawer

## Development Workflow

### Development Mode (PWA Disabled):
```bash
npm run dev
# Service worker is DISABLED in dev mode
# Hot reload works normally
# No caching issues
```

### Production Build (PWA Enabled):
```bash
npm run build
# Generates service worker and PWA assets
# Creates dist/sw.js and dist/manifest.webmanifest

npm run preview
# Test the PWA locally at http://localhost:4173
```

## PWA Features Configured

✅ **Offline Support** - Static assets cached for offline viewing
✅ **App-like Experience** - Fullscreen, no browser chrome
✅ **Home Screen Icon** - Professional branded icon
✅ **Auto Updates** - Service worker updates automatically
✅ **Network-First API** - Home Assistant API calls prioritize network
✅ **Image Caching** - Images cached for 30 days
✅ **iOS Optimized** - Apple-specific meta tags included

## Service Worker Caching Strategy

- **Static Assets** (images): Cache-first (30 day expiration)
- **Home Assistant API**: Network-first (5 minute cache fallback)
- **WebSocket Connections**: Not cached (real-time only)

## Customization

### Change App Icon:
Replace these files with your custom icons:
- `public/icon-192.png` (192x192 pixels)
- `public/icon-512.png` (512x512 pixels)

### Change App Name:
Edit `vite.config.ts` and `public/manifest.json`:
```json
{
  "name": "Your Custom Name",
  "short_name": "Custom"
}
```

### Change Theme Color:
Edit `vite.config.ts` and `index.html`:
```typescript
theme_color: '#your-color-here'
```

## Testing PWA Installation

1. Build production version: `npm run build`
2. Start preview server: `npm run preview`
3. Open in Safari/Chrome on mobile device
4. Follow installation steps above
5. Verify app opens fullscreen without browser UI

## Rollback Instructions

If you need to revert PWA changes:

```bash
git revert HEAD  # Reverts the PWA implementation commit
# Or go back to the checkpoint:
git reset --hard 3fea5c7  # "checkpoint: pre-PWA implementation backup"
```

## Known Limitations

- **iOS Safari Only**: Only Safari can install PWAs on iOS/iPadOS
- **HTTP Support**: Works on local network (http://192.168.x.x) without SSL
- **Icon Placeholders**: Current icons are simple placeholders - replace for production

## Production Deployment

For client installations:

1. Build production version: `npm run build`
2. Copy `dist/` folder to client's server
3. Serve on local network (e.g., http://homeassistant.local:3001)
4. Guide client through Safari installation process
5. App works offline and updates automatically

## Support

- PWA Manifest: Generated automatically by vite-plugin-pwa
- Service Worker: Auto-generated in production builds only
- Updates: Automatic when user refreshes or reopens app
- Debugging: Use Chrome DevTools > Application > Service Workers

---

**Note**: PWA features only activate in production builds (`npm run build`). Development mode (`npm run dev`) has PWA disabled for better developer experience.
