import { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Loader from "./ui/Loader";
import Alert from "./Alert";
import { trpc } from "../utils/trpc";

export default function PurchaseRequestModal({
  isOpen,
  onClose,
  artworkId,
  artworkTitle,
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [touched, setTouched] = useState({});
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nameInputRef = useRef(null);

  const purchaseRequest = trpc.artwork.purchaseRequest.useMutation();

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  // Focus the name input when modal opens
  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setTouched({ ...touched, [e.target.name]: true });
  };

  const validate = () => {
    return (
      form.name.trim() &&
      /^\S+@\S+\.\S+$/.test(form.email) &&
      /^\+?\d{7,15}$/.test(form.phone.replace(/\s/g, "")) &&
      form.address.trim()
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, address: true });
    setError("");
    setSuccess("");
    if (!validate()) return;
    setLoading(true);
    try {
      await purchaseRequest.mutateAsync({
        artworkId,
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        customerAddress: form.address,
      });
      setSuccess(
        "Your purchase request has been submitted! Check your inbox or spam folder for confirmation."
      );
      setForm({ name: "", email: "", phone: "", address: "" });
      setTouched({});
    } catch (err) {
      setError(err.message || "Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setError("");
    setSuccess("");
    setTouched({});
    onClose();
  };

  const handleOverlayClick = (e) => {
    // Only close if clicking directly on the overlay, not on the modal content
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="mx-2 fixed inset-0 flex items-center justify-center p-2 sm:p-4 z-[60]">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity z-[60]"
        onClick={handleOverlayClick}
      />
      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative w-full max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-white/20 z-[70] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="flex-shrink-0 px-6 py-4 relative">
          {/* Close button - positioned like ImageModal */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={closeModal}
            className="absolute right-2 sm:right-4 top-2 sm:top-4 z-10 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 sm:p-2 transition-all duration-200"
          >
            <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </motion.button>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-artistic font-bold text-gray-900 flex-1 text-center">
              Purchase Request
            </h2>
          </div>
          <p className="text-center text-gray-600 font-sans">
            Interested in <span className="font-semibold">{artworkTitle}</span>?
            Fill out the form below and we'll contact you soon.
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-6">
          {success && (
            <Alert type="success" message={success} className="mb-4" />
          )}
          {error && <Alert type="error" message={error} className="mb-4" />}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 font-sans mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                onClick={(e) => e.stopPropagation()}
                ref={nameInputRef}
                className={`block w-full border rounded-xl shadow-sm py-3 px-4 font-sans focus:ring-2 focus:border-transparent focus:outline-none ${
                  touched.name && !form.name.trim()
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-200 focus:ring-indigo-500"
                }`}
                placeholder="Your full name"
                required
              />
              {touched.name && !form.name.trim() && (
                <p className="text-sm text-red-600 mt-1 font-sans">
                  Name is required.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 font-sans mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                onClick={(e) => e.stopPropagation()}
                className={`block w-full border rounded-xl shadow-sm py-3 px-4 font-sans focus:ring-2 focus:border-transparent focus:outline-none ${
                  touched.email && !/^\S+@\S+\.\S+$/.test(form.email)
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-200 focus:ring-indigo-500"
                }`}
                placeholder="you@email.com"
                required
              />
              {touched.email && !/^\S+@\S+\.\S+$/.test(form.email) && (
                <p className="text-sm text-red-600 mt-1 font-sans">
                  Enter a valid email address.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 font-sans mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                onClick={(e) => e.stopPropagation()}
                className={`block w-full border rounded-xl shadow-sm py-3 px-4 font-sans focus:ring-2 focus:border-transparent focus:outline-none ${
                  touched.phone &&
                  !/^\+?\d{7,15}$/.test(form.phone.replace(/\s/g, ""))
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-200 focus:ring-indigo-500"
                }`}
                placeholder="e.g. +919876543210"
                required
              />
              {touched.phone &&
                !/^\+?\d{7,15}$/.test(form.phone.replace(/\s/g, "")) && (
                  <p className="text-sm text-red-600 mt-1 font-sans">
                    Enter a valid phone number.
                  </p>
                )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 font-sans mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                onClick={(e) => e.stopPropagation()}
                className={`block w-full border rounded-xl shadow-sm py-3 px-4 font-sans focus:ring-2 focus:border-transparent focus:outline-none resize-none ${
                  touched.address && !form.address.trim()
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-200 focus:ring-indigo-500"
                }`}
                placeholder="Your address"
                rows={2}
                required
              />
              {touched.address && !form.address.trim() && (
                <p className="text-sm text-red-600 mt-1 font-sans">
                  Address is required.
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Fixed Button Section */}
        <div className="flex-shrink-0 border-t border-gray-100 px-6 sm:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              onClick={(e) => {
                e.stopPropagation();
                handleSubmit(e);
              }}
              className="w-full sm:w-auto min-w-[160px] px-6 py-2 rounded-full bg-indigo-600 text-white font-sans font-semibold shadow hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading || !validate()}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeModal();
              }}
              className="w-full sm:w-auto px-6 py-2 rounded-full bg-white border border-gray-300 text-gray-700 font-sans font-semibold shadow hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
