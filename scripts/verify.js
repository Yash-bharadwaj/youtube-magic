import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

async function verify() {
  console.log("🔍 Verifying Firestore data...");
  try {
    const querySnapshot = await getDocs(collection(db, "performers"));
    console.log(`Found ${querySnapshot.size} performers:`);
    querySnapshot.forEach((doc) => {
      console.log(`- ID: ${doc.id}, Data:`, doc.data());
    });
    process.exit(0);
  } catch (error) {
    console.error("❌ Error verifying database:", error);
    process.exit(1);
  }
}

verify();
