# 🎩 Enigma Notes - Complete Setup Guide

This guide will take you through every step to get your magic app running on your own infrastructure.

---

## 1. Firebase Project Setup

### Create the Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"** and name it `enigma-notes`.
3. (Optional) Disable Google Analytics for a faster setup.
4. Click **"Create project"**.

### Add a Web App
1. On the Project Overview page, click the **Web icon (`</>`)**.
2. Register the app as `enigma-notes`.
3. **DO NOT** close the window yet! You will see a `firebaseConfig` object.
4. Copy these values into your `.env.local` file (see the [Environment Variables](#4-environment-variables) section below).

---

## 2. Firestore Database Setup

### Create Database
1. In the left sidebar, click **Firestore Database**.
2. Click **Create database**.
3. Select **"Start in production mode"**.
4. Choose a location close to you (e.g., `us-east1`).

### Create Collections
You need to create two collections. Click **"Start collection"**:

#### 1. `performers`
*   **Collection ID:** `performers`
*   **Document ID:** (Use "Auto-ID" for your first user, or a custom name)
*   **Fields:**
    *   `name` (string): Your Display Name
    *   `username` (string): Your login username (e.g., `magi1`)
    *   `password` (string): Your login password
    *   `slug` (string): Your personalized URL ending (e.g., `yash`)
    *   `lastLogin` (string): `2024-01-24`

#### 2. `rooms`
*   **Collection ID:** `rooms`
*   **Document ID:** Must match the `slug` from the performer (e.g., `yash`)
*   **Fields:**
    *   `status` (string): `idle`
    *   `videoId` (string/null): `null`
    *   `startAt` (number): `12`
    *   `updatedAt` (timestamp): `[Current Date]`

### Configure Rules (CRITICAL)
Go to the **Rules** tab in Firestore and paste this to allow the app to work:
```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read, write: if true;
    }
    match /performers/{performerId} {
      allow read: if true;
      allow write: if true; // In production, restrict this to admin only
    }
  }
}
```
*Click **Publish**.*

---

## 3. YouTube API Configuration

To make the song search live in the Magician Panel:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your Firebase project.
3. Search for **"YouTube Data API v3"** and click **Enable**.
4. Go to **Credentials** > **Create Credentials** > **API Key**.
5. Copy this key.
6. Open `components/MagicianPanel.tsx` and replace the mock fetch with a real one, or add it to your `.env.local`.

---

## 4. Environment Variables

Create a file named `.env.local` in your project root and paste your Firebase details:

```env
VITE_FIREBASE_API_KEY=AIzaSyANoIoVP2m2vUEDS03FMY9osRIAIRIg3pc
VITE_FIREBASE_AUTH_DOMAIN=enigma-notes-49eb0.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=enigma-notes-49eb0
VITE_FIREBASE_STORAGE_BUCKET=enigma-notes-49eb0.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=472057561159
VITE_FIREBASE_APP_ID=1:472057561159:web:b38eddafd156d1f14ff162
VITE_FIREBASE_MEASUREMENT_ID=G-80QW93SYWN

# For the AI interpreting Spectator Input (Optional)
VITE_GEMINI_API_KEY=YOUR_GEMINI_KEY
```

---

## 5. Deployment & PWA

### Local Test
```bash
npm install
npm run dev
```

### Deploy to Firebase Hosting
1. Install CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Init: `firebase init hosting`
4. Build: `npm run build`
5. Deploy: `firebase deploy`

---

## 6. Performance Tips
*   **Android Spectator:** The app will automatically show a Google Keep style interface.
*   **iOS Spectator:** The app will show a classic Apple Notes interface.
*   **Secret Panel:** Tap with **3 fingers** anywhere on the screen during the trick to open your secret controls.
