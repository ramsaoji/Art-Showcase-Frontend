import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

interface FirebaseArtwork {
  id: string;
  title?: string;
  artist?: string;
  price?: number;
  description?: string;
  dimensions?: string;
  material?: string;
  style?: string;
  year?: number;
  featured?: boolean;
  sold?: boolean;
  url?: string;
  cloudinary_public_id?: string;
  createdAt?: { toDate: () => Date };
  updatedAt?: { toDate: () => Date };
}

const result = dotenv.config();
if (result.error) {
  console.error("Error loading .env file:", result.error);
}
console.log("Environment variables loaded.");

// Firebase configuration (replace with your actual config or load from env)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

console.log("Firebase Config:", firebaseConfig);

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Initialize Prisma Client
const prisma = new PrismaClient();

async function migrateData() {
  try {
    console.log("Starting Firebase to Prisma migration...");

    // Fetch data from Firebase
    const artworksCol = collection(db, "artworks");
    const artworkSnapshot = await getDocs(artworksCol);

    const artworks = artworkSnapshot.docs.map((doc) => ({
      firebaseId: doc.id, // Use Firebase document ID as Prisma ID
      ...(doc.data() as FirebaseArtwork),
    }));

    console.log(`Found ${artworks.length} artworks in Firebase.`);

    // Insert data into Prisma
    for (const artwork of artworks) {
      const {
        id,
        createdAt,
        updatedAt,
        title,
        artist,
        price,
        description,
        dimensions,
        material,
        style,
        year,
        featured,
        sold,
        url,
        cloudinary_public_id,
      } = artwork;

      await prisma.artwork.upsert({
        where: { id: id },
        update: {
          title: title,
          artist: artist,
          price: price,
          description: description || null,
          dimensions: dimensions || null,
          material: material || null,
          style: style || null,
          year: year || null,
          featured: featured || false,
          sold: sold || false,
          url: url || null,
          cloudinary_public_id: cloudinary_public_id || null,
          createdAt: createdAt?.toDate ? createdAt.toDate() : new Date(),
          updatedAt: updatedAt?.toDate ? updatedAt.toDate() : new Date(),
        },
        create: {
          id: id,
          title: title || "",
          artist: artist || "",
          price: price || 0,
          description: description || null,
          dimensions: dimensions || null,
          material: material || null,
          style: style || null,
          year: year || null,
          featured: featured || false,
          sold: sold || false,
          url: url || null,
          cloudinary_public_id: cloudinary_public_id || null,
          createdAt: createdAt?.toDate ? createdAt.toDate() : new Date(),
          updatedAt: updatedAt?.toDate ? updatedAt.toDate() : new Date(),
        },
      });
      console.log(`Migrated artwork with ID: ${artwork.id}`);
    }

    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
