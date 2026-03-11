import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function RouteSuspenseFallback() {
  const [show, setShow] = useState(false);

  // Delay showing the loader to prevent flashing on fast loads
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 150);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[100] overflow-hidden bg-indigo-100/50">
      <motion.div
        className="h-full bg-indigo-600"
        initial={{ width: "0%", x: "0%" }}
        animate={{ 
          width: ["0%", "30%", "100%"],
          x: ["0%", "20%", "100%"] 
        }}
        transition={{ 
          duration: 1.5, 
          ease: "easeInOut",
          repeat: Infinity
        }}
      />
    </div>
  );
}
