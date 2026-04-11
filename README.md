# NovaChat Frontend 📱

Welcome to the React Native (Expo) frontend of the Real-Time Chat App! This side of the application handles all UI rendering, persistent navigation semantics, real-time UX updates, and mobile client connectivity.

## 🌈 Key UI Features
- **Modern Styling**: Styled identically to top-tier minimal messaging apps using CSS variants, Gradients, and auto Drop-Shadows.
- **Socket Reactivity**: Live messages execute correctly inside `KeyboardAvoidingView` without hiding beneath the keyboards. Lists automatically auto-pan smoothly to the very bottom upon receiving inbound pings!
- **Async Storage Built-in**: Deep persistent device session caching! If a user successfully logs in, it securely skips the Auth Flow seamlessly upon future reloads.

## 📦 Dependencies Mapping
This app relies heavily on the Expo toolchain and modern JS frameworks:
- `@react-navigation/native-stack` for fluent Stack routing and header customization.
- `expo-linear-gradient` for premium color transitions.
- `socket.io-client` for fetching full real-time websockets globally natively.
- `@react-native-async-storage/async-storage` for retaining app-user session states.

## ⚙️ Networking Setup (config.js)
All API strings map natively to `src/config.js`. Please ensure your Network IP or Cloud API is updated within before testing on Physical Devices:
```javascript
export const BASE_URL = 'https://chatbakend.onrender.com';
```

## 🚀 How to Run Locally

If testing via Expo CLI natively:
```bash
# 1. Install all required dependencies
npm install

# 2. Boot Expo Server
npx expo start
```
Scan the massive QR code generated with the **Expo Go** App (Available on iOS App Store & Android Google Play Store) to instantly stream changes live directly to your smartphone!
