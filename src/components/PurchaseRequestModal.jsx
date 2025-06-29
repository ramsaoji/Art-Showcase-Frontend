import { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Loader from "./ui/Loader";
import Alert from "./Alert";
import { trpc } from "../utils/trpc";
import { getFriendlyErrorMessage } from "../utils/formatters";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup
    .string()
    .email("Please enter a valid email address")
    .test(
      "no-dot-before-at",
      "Email cannot have a dot right before @",
      (value) => !value || !/\.@/.test(value)
    )
    .required("Email is required"),
  phone: yup
    .string()
    .matches(/^\d{10}$/, "Enter a valid 10-digit phone number")
    .required("Phone number is required"),
  address: yup.string().required("Address is required"),
});

export default function PurchaseRequestModal({
  isOpen,
  onClose,
  artworkId,
  artworkTitle,
}) {
  const [success, setSuccess] = useState("");
  const [serverError, setServerError] = useState("");
  const nameInputRef = useRef(null);
  const scrollableContentRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    // mode: "onTouched",
  });
  const { ref: formRef, ...nameProps } = register("name");

  const purchaseRequest = trpc.artwork.purchaseRequest.useMutation({
    onError: (err) => {
      console.error("Purchase request failed:", err);
      setServerError(getFriendlyErrorMessage(err));
    },
  });

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Reset form when modal is opened
      reset();
      setSuccess("");
      setServerError("");
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, reset]);

  // Focus the name input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Delay focus to allow the modal animation to complete smoothly.
      const timer = setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 350); // A bit longer than the typical 300ms animation duration

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const onSubmit = async (data) => {
    setServerError("");
    setSuccess("");
    try {
      await purchaseRequest.mutateAsync({
        artworkId,
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        customerAddress: data.address,
      });
      setSuccess(
        "Your purchase request has been submitted! Check your inbox or spam folder for confirmation."
      );
      reset();
      if (scrollableContentRef.current) {
        scrollableContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      // The onError handler of the mutation will be called, but this is a fallback.
      console.error("Purchase request submission failed:", err);
      setServerError(getFriendlyErrorMessage(err));
      if (scrollableContentRef.current) {
        scrollableContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const closeModal = () => {
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
    <div className="mx-2 fixed inset-0 flex items-center justify-center p-4 md:p-6 z-[60]">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity z-[60]"
        onClick={handleOverlayClick}
      />
      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative w-full max-w-xl mx-auto bg-white rounded-2xl shadow-2xl border border-white/20 z-[70] flex flex-col"
        style={{
          maxHeight: "calc(100dvh - 5rem)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="flex-shrink-0 px-6 py-6 relative">
          {/* Close button - positioned like ImageModal */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={closeModal}
            className="absolute right-2 sm:right-4 top-2 sm:top-4 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-gray-100/80 backdrop-blur-md text-gray-500 transition-all duration-200 hover:bg-gray-200 hover:text-gray-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-300 border border-gray-200/50"
          >
            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
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
        <div
          className="flex-1 overflow-y-auto px-6 sm:px-8 pb-6"
          ref={scrollableContentRef}
        >
          {(success || serverError) && (
            <div className="mb-4">
              {success && <Alert type="success" message={success} />}
              {serverError && <Alert type="error" message={serverError} />}
            </div>
          )}
          <form
            id="purchase-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 font-sans mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...nameProps}
                onClick={(e) => e.stopPropagation()}
                ref={(e) => {
                  formRef(e);
                  nameInputRef.current = e;
                }}
                className={`block w-full border rounded-xl shadow-sm py-3 px-4 font-sans focus:ring-2 focus:border-transparent focus:outline-none ${
                  errors.name
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-200 focus:ring-indigo-500"
                }`}
                placeholder="Your full name"
              />
              {errors.name && (
                <p className="text-base text-red-600 mt-1 font-sans">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 font-sans mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register("email")}
                onClick={(e) => e.stopPropagation()}
                className={`block w-full border rounded-xl shadow-sm py-3 px-4 font-sans focus:ring-2 focus:border-transparent focus:outline-none ${
                  errors.email
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-200 focus:ring-indigo-500"
                }`}
                placeholder="you@email.com"
              />
              {errors.email && (
                <p className="text-base text-red-600 mt-1 font-sans">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 font-sans mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                {...register("phone")}
                onClick={(e) => e.stopPropagation()}
                maxLength={10}
                className={`block w-full border rounded-xl shadow-sm py-3 px-4 font-sans focus:ring-2 focus:border-transparent focus:outline-none ${
                  errors.phone
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-200 focus:ring-indigo-500"
                }`}
                placeholder="e.g. 9876543210"
              />
              {errors.phone && (
                <p className="text-base text-red-600 mt-1 font-sans">
                  {errors.phone.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 font-sans mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register("address")}
                onClick={(e) => e.stopPropagation()}
                className={`block w-full border rounded-xl shadow-sm py-3 px-4 font-sans focus:ring-2 focus:border-transparent focus:outline-none resize-none ${
                  errors.address
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-200 focus:ring-indigo-500"
                }`}
                placeholder="Your address"
                rows={2}
              />
              {errors.address && (
                <p className="text-base text-red-600 mt-1 font-sans">
                  {errors.address.message}
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Fixed Button Section */}
        <div className="flex-shrink-0 border-t border-gray-100 px-6 sm:px-8 py-4 sm:py-6">
          <div className="flex flex-row gap-3">
            <button
              type="submit"
              form="purchase-form"
              className="flex-1 min-w-0 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 text-white font-sans font-semibold shadow hover:from-indigo-600 hover:via-indigo-700 hover:to-indigo-800 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
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
              className="flex-1 min-w-0 px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 font-sans font-semibold shadow hover:bg-gray-50 transition-colors whitespace-nowrap text-base"
              disabled={isSubmitting}
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
