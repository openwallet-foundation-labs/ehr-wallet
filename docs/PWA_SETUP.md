# PWA Setup

EHR Wallet is configured as a Progressive Web App (PWA) enabling offline capabilities and installability on mobile and desktop devices.

## Configuration

### Manifest File

The PWA manifest is defined in `public/manifest.json`:

```json
{
  "name": "GlobalRad - Imaging Hub",
  "short_name": "GlobalRad",
  "description": "Modern radiology information system for patient management and PACS integration",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#FFFFFF",
  "icons": [...]
}
```

### Key Manifest Properties

| Property | Value | Description |
|----------|-------|-------------|
| `display` | `standalone` | Opens in standalone mode (like a native app) |
| `theme_color` | `#FFFFFF` | Status bar color on mobile devices |
| `start_url` | `/` | URL to launch from home screen |

### Icon Requirements

The manifest references icons in multiple sizes:
- 72x72, 96x96, 128x128, 144x144, 152x152
- 192x192 (Android)
- 384x384, 512x512 (Android adaptive icons)

Place icons in the `public/icons/` directory.

## PWA Utilities

The `lib/pwa-utils.ts` module provides PWA-related functionality:

```typescript
import {
  initPWA,
  canInstallPWA,
  showInstallPrompt,
  isInStandaloneMode,
  isIOS,
  isAndroid
} from '@/lib/pwa-utils';
```

### Functions

**`initPWA()`**
- Initializes PWA event listeners
- Call this once when the app starts
- Handles `beforeinstallprompt` and `appinstalled` events

**`canInstallPWA()`**
- Returns `true` if the app can be installed
- Checks if the install prompt is available

**`showInstallPrompt()`**
- Shows the native install prompt
- Returns: `'accepted'`, `'dismissed'`, or `'unavailable'`

**`isInStandaloneMode()`**
- Returns `true` if the app is running as an installed PWA

**`isIOS()`** / **`isAndroid()`**
- Returns `true` if running on iOS or Android respectively

## Installation

### Android

1. Open the app in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home Screen" or "Install App"
4. Confirm installation

### iOS

1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Confirm installation

### Desktop

1. Open the app in Chrome, Edge, or Firefox
2. Look for the install icon in the address bar
3. Click to install

## Offline Capabilities

The PWA includes offline support for:
- Viewing cached pages
- Accessing previously viewed patient data
- Offline authentication via stored sessions

### Service Worker

To add full offline support, create a service worker in `public/sw.js`:

```javascript
const CACHE_NAME = 'ehr-wallet-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  // Add other critical assets
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

Register the service worker in your app:

```typescript
// In a useEffect or component
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

## Testing PWA

### Chrome DevTools

1. Open DevTools (F12)
2. Go to the "Application" tab
3. Check "Manifest" for manifest details
4. Check "Service Workers" for worker status

### Lighthouse

Run Lighthouse PWA audit:
```bash
npm run build
npm start
# Open http://localhost:3000 in Chrome
# Run Lighthouse > PWA category
```

## Platform-Specific Considerations

### iOS Quirks

- PWA must be opened in Safari for installation
- Standalone mode detection: `(window.navigator as any).standalone`
- Some features may have limited support

### Android

- Chrome required for best PWA support
- App can be installed from Chrome menu
- Supports push notifications with additional configuration

## Environment Variables

No additional environment variables are required for basic PWA functionality. The manifest and utilities work out of the box.
