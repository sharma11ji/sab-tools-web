# SAB Book

Next.js 14 + Firebase (Auth + Firestore) + Vercel.

## Firebase setup (ek baar)
1. Console > Authentication > Sign-in method > **Google** enable karo.
2. Authentication > Settings > Authorized domains mein apna Vercel domain add karo.
3. Firestore Database banao, phir `firestore.rules` ka content Rules tab mein paste karo.
4. Collection `apis` banao. Har document mein fields: `name` (string), `description` (string), `url` (string), `icon` (string, optional), `createdAt` (timestamp).

## Local
```
npm install
npm run dev
```
