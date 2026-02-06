import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface RefreshSuggestionProps {
  suggestion: string | null;
  onClose: () => void;
}

export default function RefreshSuggestion({ suggestion, onClose }: RefreshSuggestionProps) {
  useEffect(() => {
    if (suggestion) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [suggestion, onClose]);

  return (
    <AnimatePresence>
      {suggestion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed top-6 left-1/2 w-full max-w-md -translate-x-1/2 rounded-lg border border-indigo-200 bg-indigo-50/90 p-6 shadow-lg backdrop-blur-md"
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-indigo-400 hover:text-indigo-600 cursor-pointer"
          >
            <X size={16} />
          </button>
          <p className="text-lg font-medium text-indigo-700 pr-6 text-center">{suggestion}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
