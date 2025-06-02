import React from "react";
import { motion } from "framer-motion";

const Loader = ({ size = "medium", className = "" }) => {
  const sizeClasses = {
    small: "w-5 h-5",
    medium: "w-16 h-16",
    large: "w-24 h-24",
  };

  const containerSize = {
    small: "w-8 h-8",
    medium: "w-24 h-24",
    large: "w-32 h-32",
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`relative ${containerSize[size]}`}>
        {/* Main spinning circle with indigo gradient */}
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400`}
          animate={{ rotate: 360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Inner spinning circle */}
        <motion.div
          className={`absolute inset-1 rounded-full bg-white`}
          animate={{ scale: [1, 0.9, 1] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Center dot with pulse effect */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div
            className={`${sizeClasses[size]} scale-[0.2] rounded-full bg-indigo-600`}
          />
        </motion.div>

        {/* Decorative dots */}
        {["top", "right", "bottom", "left"].map((position, index) => (
          <motion.div
            key={position}
            className="absolute w-2 h-2 rounded-full bg-indigo-500"
            style={{
              [position]: "0",
              left:
                position === "top" || position === "bottom"
                  ? "50%"
                  : position === "left"
                  ? "0"
                  : "auto",
              right: position === "right" ? "0" : "auto",
              transform: "translate(-50%, -50%)",
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.5,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Artistic swirl */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: -360 }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M50 10 C 20 10, 10 20, 10 50 C 10 80, 20 90, 50 90 C 80 90, 90 80, 90 50 C 90 20, 80 10, 50 10"
              stroke="url(#gradient)"
              strokeWidth="1"
              strokeDasharray="4 4"
              fill="none"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#4338CA" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3730A3" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </div>
    </div>
  );
};

export default Loader;
