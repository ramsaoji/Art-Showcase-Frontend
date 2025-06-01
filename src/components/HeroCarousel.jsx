import { useEffect, useState } from "react";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { getOptimizedImageUrl } from "../config/cloudinary";

export default function HeroCarousel() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const artworksQuery = query(
          collection(db, "artworks")
          //   where("featured", "==", true),
          //   limit(3)
        );

        const querySnapshot = await getDocs(artworksQuery);
        const artworks = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setImages(artworks);
      } catch (error) {
        console.error("Error loading carousel images:", error);
      }
    };

    loadImages();
  }, []);

  if (images.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/40 z-10" />
      <div className="flex animate-scroll z-[5]">
        {/* First set */}
        {images.map((image) => (
          <div
            key={image.id}
            className="flex-none w-full sm:w-1/2 md:w-1/3 h-full relative"
          >
            <img
              src={
                image.public_id
                  ? getOptimizedImageUrl(image.public_id)
                  : image.url
              }
              alt={image.title}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        {/* Duplicate set for seamless loop */}
        {images.map((image) => (
          <div
            key={`${image.id}-duplicate`}
            className="flex-none w-full sm:w-1/2 md:w-1/3 h-full relative"
          >
            <img
              src={
                image.public_id
                  ? getOptimizedImageUrl(image.public_id)
                  : image.url
              }
              alt={image.title}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
