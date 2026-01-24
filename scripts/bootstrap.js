import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function bootstrap() {
  console.log("🚀 Starting database initialization...");

  const adminUser = {
    name: "Super Admin",
    username: "yashwanthmantha1@gmail.com",
    password: "Yash2999@",
    slug: "admin-room",
    role: "ADMIN",
    lastLogin: new Date().toISOString()
  };

  try {
    // 1. Create the admin performer (this overwrites the previous one)
    await setDoc(doc(db, "performers", "superadmin"), adminUser);
    console.log("✅ Super Admin user updated with correct name and password.");

    // 2. Create the admin room
    await setDoc(doc(db, "rooms", "admin-room"), {
      status: "idle",
      videoId: null,
      startAt: 12,
      updatedAt: serverTimestamp()
    });
    console.log("✅ Default room created in 'rooms' collection.");

    console.log("\n✨ DATABASE INITIALIZED SUCCESSFULLY!");
    console.log("Username: yashwanthmantha1@gmail.com");
    console.log("Password: Yash2999@");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    process.exit(1);
  }
}

bootstrap();
