import { motion } from "framer-motion";
import Loader from "./Loader";

export default function PageLoader() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center">
        <Loader size="lg" />
        <p className="mt-4 text-lg text-gray-600 font-sans">
          Loading content...
        </p>
      </div>
    </motion.div>
  );
}
