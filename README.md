# Home Assistant Tablet Dashboard

A modern, touch-optimized Progressive Web App (PWA) for controlling your Home Assistant smart home from tablets and mobile devices. Features drag-and-drop device organization, room-based layouts, and specialized cards for Tesla Solar, climate control, and more.

## 🎯 Project Overview

**Status:** Active Development
**Version:** 0.0.0
**Primary Use Case:** Wall-mounted tablet dashboard for smart home control
**Target Devices:** iPad, Android tablets, and desktop browsers

### Key Features

- ✅ **PWA Support** - Install directly to home screen on tablets
- ✅ **Drag & Drop** - Reorder device cards with touch-friendly interactions
- ✅ **Room Organization** - Group devices by rooms with visual navigation
- ✅ **Tesla Solar Integration** - Real-time energy monitoring with bar graphs
- ✅ **Climate Control** - Full thermostat control with mode switching
- ✅ **Touch-Optimized** - Long-press interactions and swipe gestures
- ✅ **Dark/Light Themes** - Automatic theme switching
- ✅ **Live Entity Sync** - Real-time updates from Home Assistant

## 🏗️ Current Architecture

### Tech Stack

- **Framework:** React 18.3 + TypeScript
- **Build Tool:** Vite 5.4
- **UI Library:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS 3.4
- **State Management:** Zustand 5.0
- **Drag & Drop:** @dnd-kit
- **Charts:** Recharts 2.15
- **HA Integration:** home-assistant-js-websocket 9.5
- **PWA:** vite-plugin-pwa + Workbox

### Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components (40+ components)
│   ├── DeviceCard.tsx         # Individual device control card
│   ├── TeslaSolarCard.tsx     # Tesla energy monitoring with graphs
│   ├── TemperatureControl.tsx # Climate control interface
│   ├── WeatherCard.tsx        # Weather display
│   ├── LoginScreen.tsx        # Home Assistant authentication
│   └── ThemeToggle.tsx        # Dark/light mode switcher
│
├── lib/
│   ├── dashboard/
│   │   ├── UniversalDeviceCard.tsx    # Generic HA entity card
│   │   ├── SortableDeviceCard.tsx     # Drag-and-drop wrapper
│   │   ├── SolarEntityConfigDialog.tsx # Tesla config UI
│   │   ├── AdminDialog.tsx            # Admin settings panel
│   │   ├── SettingsDialog.tsx         # User preferences
│   │   └── DeviceLibraryDialog.tsx    # Device template browser
│   └── rooms/
│       ├── roomStore.ts       # Zustand store for room state
│       └── types.ts           # Type definitions
│
├── hooks/
│   ├── useLongPress.ts        # Touch gesture detection
│   └── use-mobile.tsx         # Responsive breakpoint detection
│
├── stores/
│   ├── authStore.ts           # Home Assistant auth state
│   └── settingsStore.ts       # User preferences
│
├── pages/
│   ├── Index.tsx              # Main dashboard page
│   └── TestDashboard.tsx      # Development testing page
│
└── utils/
    └── teslaEntityFinder.ts   # Tesla entity auto-detection
```

## 🏠 Core Features Detail

### 1. Room Management

- **Dynamic Room Creation** - Add/remove rooms with custom names and icons
- **Room Switching** - Navigate between rooms with smooth transitions
- **Device Assignment** - Assign devices to specific rooms
- **Visual Organization** - Lucide icons for easy room identification

**Files:** [src/lib/rooms/roomStore.ts](src/lib/rooms/roomStore.ts), [src/pages/Index.tsx](src/pages/Index.tsx)

### 2. Device Cards

**Universal Device Card** ([UniversalDeviceCard.tsx](src/lib/dashboard/UniversalDeviceCard.tsx))
- Auto-detects entity type (light, switch, sensor, etc.)
- Entity-specific controls (brightness sliders, color pickers)
- Real-time state updates
- Touch-optimized controls

**Tesla Solar Card** ([TeslaSolarCard.tsx](src/components/TeslaSolarCard.tsx))
- Energy flow visualization (Solar → Home → Grid)
- Bar graph view for historical trends
- Auto-detection of Tesla entities
- Real-time power metrics
- Configurable entity mapping

**Temperature Control** ([TemperatureControl.tsx](src/components/TemperatureControl.tsx))
- Thermostat mode switching (heat, cool, auto, fan)
- Target temperature adjustment
- Current temperature display
- On/off control

### 3. Drag & Drop System

**Implementation:** [@dnd-kit](https://dndkit.com/) library

**Features:**
- Touch sensor with 10px activation threshold
- Pointer sensor with 10px distance threshold
- Grid-based sorting with collision detection
- Persistent order saved to room store
- Visual feedback during drag

**Files:** [src/lib/dashboard/SortableDeviceCard.tsx](src/lib/dashboard/SortableDeviceCard.tsx), [src/pages/Index.tsx:25-40](src/pages/Index.tsx#L25-L40)

### 4. Home Assistant Integration

**WebSocket Connection:**
- Real-time entity state updates
- Command execution (turn_on, turn_off, set_temperature, etc.)
- Entity discovery and filtering
- Connection state management
- Auto-reconnect on disconnect

**Authentication:**
- Long-lived access token support
- Secure credential storage in localStorage
- Connection validation

**Files:** [src/stores/authStore.ts](src/stores/authStore.ts), [src/components/LoginScreen.tsx](src/components/LoginScreen.tsx)

### 5. PWA Capabilities

**Manifest Features:**
- Standalone app mode (hides browser chrome)
- Custom app icon and splash screen
- 512×512 maskable icon for Android
- Landscape/portrait orientation support

**Service Worker:**
- Offline fallback page
- Asset caching strategy
- Background sync ready
- Auto-update on new deployment

**Installation:**
- iOS: Safari → Share → Add to Home Screen
- Android: Chrome → Menu → Install App
- Desktop: Install icon in address bar

**Files:** [vite.config.ts](vite.config.ts), [public/manifest.json](public/manifest.json), [public/sw.js](public/sw.js)

### 6. Touch Optimizations

**Long-Press Detection** ([useLongPress.ts](src/hooks/useLongPress.ts))
- 500ms threshold for context menus
- Prevents accidental activation
- Touch-only (desktop uses right-click)

**Gesture Support:**
- Swipe between rooms (planned)
- Pull-to-refresh (planned)
- Pinch-to-zoom on charts (planned)

**Touch Targets:**
- Minimum 44×44px interactive areas
- Larger buttons on tablet breakpoints
- Adequate spacing between tappable elements

## 📱 Responsive Design

### Current Breakpoints

```tsx
// Device card grid
grid-cols-2              // < 768px (mobile)
md:grid-cols-3           // 768px+ (tablet portrait)
lg:grid-cols-4           // 1024px+ (tablet landscape)
```

### Tablet Optimization Status

⚠️ **In Progress** - See [TABLET_OPTIMIZATION_PLAN.md](TABLET_OPTIMIZATION_PLAN.md) for detailed roadmap

**Completed:**
- ✅ Drag-and-drop with touch sensors
- ✅ Long-press gestures
- ✅ Basic responsive grid
- ✅ PWA installation

**Pending:**
- 🔲 Touch target size expansion (44px minimum)
- 🔲 Larger typography for readability
- 🔲 Swipe gestures for room navigation
- 🔲 Improved slider controls for touch
- 🔲 Active/pressed states for all buttons

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Home Assistant instance with WebSocket API enabled
- Long-lived access token from Home Assistant

### Installation

```bash
# Clone the repository
git clone https://github.com/PixelatoStudio/HomeAssistantUI.git
cd HomeAssistantUI

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Server

- **URL:** http://localhost:8080
- **Hot Reload:** Enabled via Vite
- **Network Access:** Available on local network for tablet testing

### Build for Production

```bash
# Production build with minification
npm run build

# Development build (unminified for debugging)
npm run build:dev

# Preview production build
npm run preview
```

### Configuration

**Home Assistant Connection:**

1. Navigate to your Home Assistant → Profile → Long-Lived Access Tokens
2. Create a new token
3. Enter credentials in the login screen:
   - Host: `http://your-ha-ip:8123` (or `https://` if using SSL)
   - Token: Your long-lived access token

**Credentials are stored locally in the browser's localStorage**

## 🎨 Customization

### Adding Custom Device Cards

1. Create new component in `src/components/`
2. Define entity type detection logic
3. Import and add to [UniversalDeviceCard.tsx](src/lib/dashboard/UniversalDeviceCard.tsx) switch statement
4. Add icon mapping in device template

### Creating Rooms

- Click "+" button in room navigation bar
- Choose from 50+ Lucide icons
- Assign devices from library or entity scan

### Theme Customization

- **Theme Toggle:** Top-right corner of dashboard
- **Custom Colors:** Edit [src/index.css](src/index.css) CSS variables
- **Background Image:** Settings → Toggle background image

## 📊 State Management

### Zustand Stores

**Room Store** ([roomStore.ts](src/lib/rooms/roomStore.ts))
- Room CRUD operations
- Device assignment to rooms
- Device ordering within rooms
- Selected room state
- Persisted to localStorage

**Auth Store** ([authStore.ts](src/stores/authStore.ts))
- Connection credentials
- Authentication status
- WebSocket connection state
- Persisted to localStorage (encrypted)

**Settings Store** ([settingsStore.ts](src/stores/settingsStore.ts))
- UI preferences (theme, background)
- User customization options
- Persisted to localStorage

## 🧪 Development & Testing

### Available Scripts

```bash
npm run dev          # Start dev server (localhost:8080)
npm run build        # Production build
npm run build:dev    # Development build (unminified)
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Testing on Physical Devices

1. Start dev server: `npm run dev`
2. Find local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Access from tablet: `http://[your-ip]:8080`
4. Test touch interactions on actual hardware

**Recommended Test Devices:**
- iPad Pro 12.9" (1024×1366)
- iPad Air (820×1180)
- Samsung Galaxy Tab (various sizes)
- Desktop browser (Chrome DevTools device mode)

### Browser DevTools

```
Chrome/Edge: F12 → Toggle Device Toolbar (Ctrl+Shift+M)
Safari: Develop → Enter Responsive Design Mode
```

**Test at these breakpoints:**
- 768px (iPad Mini portrait)
- 820px (iPad Air portrait)
- 1024px (iPad landscape)
- 1366px (iPad Pro landscape)

## 📦 Dependencies

### Production

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 18.3 | UI framework |
| `home-assistant-js-websocket` | 9.5 | HA WebSocket client |
| `zustand` | 5.0 | State management |
| `@dnd-kit/*` | 6.3 - 10.0 | Drag and drop |
| `recharts` | 2.15 | Charts/graphs |
| `framer-motion` | 12.23 | Animations |
| `@radix-ui/*` | Latest | UI primitives |
| `lucide-react` | 0.462 | Icon library |
| `tailwindcss` | 3.4 | CSS framework |
| `vite-plugin-pwa` | 1.0 | PWA support |

### Development

| Package | Purpose |
|---------|---------|
| `vite` | Build tool |
| `typescript` | Type safety |
| `eslint` | Code linting |
| `@vitejs/plugin-react-swc` | Fast refresh |

Full dependency list: [package.json](package.json)

## 🐛 Known Issues

### Current Limitations

1. **Touch Targets Too Small** - Many interactive elements below 44px minimum (See [TABLET_OPTIMIZATION_PLAN.md](TABLET_OPTIMIZATION_PLAN.md))
2. **No Offline Mode** - Requires active HA connection (PWA offline page shows fallback)
3. **Limited Entity Types** - Not all HA entity types have dedicated cards yet
4. **No Multi-Select** - Can't configure multiple devices at once
5. **Hardcoded Icons** - Room icons limited to predefined set

### Planned Improvements

- Tablet UI refinement (touch targets, typography, gestures)
- Additional entity type support (covers, fans, cameras)
- Multi-device configuration
- Custom icon upload
- Entity grouping/scenes
- Voice control integration
- Analytics dashboard

## 🔒 Security Considerations

- **Credentials Storage:** Access tokens stored in localStorage (not encrypted by default)
- **HTTPS Required:** For production use, serve over HTTPS
- **Network Security:** Keep dashboard on same network as Home Assistant
- **Token Expiration:** Rotate long-lived tokens periodically
- **PWA Security:** Service worker requires HTTPS (except localhost)

**Production Deployment:**
- Use reverse proxy (Nginx, Caddy) with SSL
- Implement authentication layer if exposing publicly
- Consider Home Assistant Cloud for remote access
- Regular security updates via `npm audit`

## 📝 Git Workflow

### Recent Commits

```
f9733aa - feat: add tablet optimization features (Latest)
49bbc1f - feat: add PWA support for tablet installation
3fea5c7 - checkpoint: pre-PWA implementation backup
bb694bd - Update subtitle text
39a0d6d - Update project title and font color
```

### Commit Message Format

```
feat: add tablet optimization features

- Add drag-and-drop device card sorting
- Implement long-press interactions for touch devices
- Add solar entity configuration dialog
- Improve UI components for tablet usage

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### Important Files Excluded

`.gitignore` includes:
- `.mcp.json` - Contains API keys (DO NOT COMMIT)
- `node_modules/`
- `dist/`
- `.env.local`

## 📚 Additional Documentation

- **Tablet Optimization Plan:** [TABLET_OPTIMIZATION_PLAN.md](TABLET_OPTIMIZATION_PLAN.md)
- **shadcn/ui Docs:** https://ui.shadcn.com
- **Home Assistant WebSocket:** https://developers.home-assistant.io/docs/api/websocket
- **Vite PWA Plugin:** https://vite-pwa-org.netlify.app

## 🤝 Contributing

This is a personal project, but suggestions and bug reports are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on physical tablet device
5. Submit pull request with screenshots

## 📄 License

This project is private and not licensed for public use.

## 🙏 Acknowledgments

- **shadcn/ui** - Beautiful, accessible component library
- **Radix UI** - Unstyled component primitives
- **Home Assistant** - Open-source home automation platform
- **Vite** - Fast build tool and dev server
- **@dnd-kit** - Modern drag-and-drop library

---

**Last Updated:** 2025-10-01
**Repository:** https://github.com/PixelatoStudio/HomeAssistantUI
**Maintainer:** Frank Velasco
