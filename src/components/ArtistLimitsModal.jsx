import { Fragment, useEffect, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import XMarkIcon from "@heroicons/react/24/outline/XMarkIcon";
import { motion } from "framer-motion";

/**
 * Config-driven artist limit fields. Add new limits here to scale the form.
 * Each entry: key (matches API), label, description, min, max, defaultKey (for reset-to-defaults).
 */
export const ARTIST_LIMITS_CONFIG = [
  {
    key: "monthlyUploadLimit",
    label: "Monthly upload limit",
    description: "Max artworks this artist can upload per calendar month.",
    min: 1,
    max: 1000,
    defaultKey: "monthlyUpload",
  },
  {
    key: "aiDescriptionDailyLimit",
    label: "AI description daily limit",
    description: "Max AI-generated descriptions per day.",
    min: 1,
    max: 100,
    defaultKey: "aiDescriptionDaily",
  },
  {
    key: "imageUploadLimit",
    label: "Images per artwork",
    description: "Max images allowed per single artwork.",
    min: 1,
    max: 1000,
    defaultKey: "imageUpload",
  },
];

const closeButtonMotion = { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } };

/**
 * Reusable modal for editing artist quota/limits. Uses Headless UI Dialog (portal +
 * click-outside to close). Config-driven so new limits can be added via ARTIST_LIMITS_CONFIG.
 */
export default function ArtistLimitsModal({
  isOpen,
  onClose,
  user,
  formValues,
  onFormChange,
  onSave,
  onResetToDefaults,
  isSaving,
}) {
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      const t = setTimeout(() => firstInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!isSaving) onClose();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white/95 backdrop-blur-sm text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-white/20 font-sans">
                <div className="px-4 pb-4 pt-5 sm:p-6">
                  {/* Header: title + close (same as ConfirmationDialog / SocialMediaModal) */}
                  <div className="flex items-start justify-between gap-4 sm:flex-row-reverse sm:justify-between">
                    <motion.button
                      type="button"
                      {...closeButtonMotion}
                      onClick={handleClose}
                      disabled={isSaving}
                      className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-gray-100/80 backdrop-blur-md text-gray-500 transition-all hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 border border-gray-200/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Close"
                    >
                      <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </motion.button>
                    <div className="min-w-0 flex-1">
                      <Dialog.Title
                        as="h3"
                        id="artist-limits-dialog-title"
                        className="font-artistic text-2xl font-bold tracking-wide text-gray-900"
                      >
                        Quota & limits
                      </Dialog.Title>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {user?.artistName || user?.email || "Artist"}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-3 mb-4">
                    Set per-artist limits. These apply across all artworks for this artist.
                  </p>

                  <div className="mt-2 max-h-[60vh] overflow-y-auto px-1 py-1">
                    {ARTIST_LIMITS_CONFIG.map((field, index) => (
                      <div key={field.key}>
                        <label
                          htmlFor={`limits-${field.key}`}
                          className="block text-sm font-medium text-gray-700 mb-0.5"
                        >
                          {field.label}
                        </label>
                        <p className="text-xs text-gray-500 mb-1.5">{field.description}</p>
                        <input
                          ref={index === 0 ? firstInputRef : undefined}
                          id={`limits-${field.key}`}
                          type="number"
                          min={field.min}
                          max={field.max}
                          value={formValues[field.key] ?? ""}
                          onChange={(e) =>
                            onFormChange((prev) => ({
                              ...prev,
                              [field.key]: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-gray-900 font-sans"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3 mt-6 justify-between items-center">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onResetToDefaults}
                      disabled={isSaving}
                      className="text-sm text-gray-500 hover:text-indigo-600 font-medium transition-colors disabled:opacity-50"
                    >
                      Reset to defaults
                    </motion.button>
                    <div className="flex gap-3">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleClose}
                        disabled={isSaving}
                        className="inline-flex justify-center items-center px-5 py-2.5 rounded-xl bg-white font-sans text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onSave}
                        disabled={isSaving}
                        className="inline-flex justify-center items-center px-5 py-2.5 rounded-xl bg-indigo-600 font-sans text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? "Saving…" : "Save limits"}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
