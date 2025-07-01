import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { trackFormSubmission } from "../services/analytics";
import { trpcClient } from "../utils/trpc";
import Loader from "../components/ui/Loader";
import Alert from "../components/Alert";
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
  message: yup.string().required("Message is required"),
});

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    // mode: "onTouched",
  });

  const onSubmit = async (data) => {
    setServerError("");
    try {
      trackFormSubmission("contact", {
        has_name: !!data.name,
        has_email: !!data.email,
        message_length: data.message.length,
      });
      await trpcClient.misc.sendContactMessage.mutate(data);
      setSubmitted(true);
      reset();
    } catch (err) {
      console.error("Contact form submission error:", err);
      setServerError(getFriendlyErrorMessage(err));
    }
  };

  return (
    <div className="relative min-h-screen bg-white/50">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-96 right-1/2 transform translate-x-1/2">
          <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-500/10 via-indigo-600/10 to-indigo-700/10 blur-3xl" />
        </div>
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
          <div className="w-96 h-96 rounded-full bg-gradient-to-br from-indigo-500/8 via-indigo-600/8 to-indigo-700/8 blur-3xl" />
        </div>
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl lg:text-6xl font-bold mb-4 font-artistic text-center tracking-wide text-gray-900">
              Get in Touch
            </h1>
            <p className="text-lg sm:text-xl font-sans text-gray-600 leading-relaxed">
              Have a question or want to collaborate? We'd love to hear from
              you.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-gray-100"
          >
            <div className="p-8">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <h2 className="font-artistic text-3xl font-bold text-gray-900 mb-4">
                    Thank You!
                  </h2>
                  <p className="font-sans text-lg text-gray-600">
                    Your message has been sent successfully. We'll get back to
                    you soon.
                  </p>
                </motion.div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                  {/* Honeypot */}
                  <input
                    type="text"
                    name="_honey"
                    style={{ display: "none" }}
                  />
                  {serverError && <Alert type="error" message={serverError} />}
                  <div>
                    <label
                      htmlFor="name"
                      className="block font-sans text-sm font-medium text-gray-700 mb-2"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      {...register("name")}
                      className={`w-full px-4 py-3 rounded-xl border font-sans text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none transition duration-200 ${
                        errors.name
                          ? "border-red-500 ring-red-500"
                          : "border-gray-200 focus:ring-indigo-500 focus:border-transparent"
                      }`}
                      placeholder="Your name"
                      disabled={isSubmitting}
                      autoFocus
                    />
                    {errors.name && (
                      <p className="text-red-500 text-base font-sans mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block font-sans text-sm font-medium text-gray-700 mb-2"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      {...register("email")}
                      className={`w-full px-4 py-3 rounded-xl border font-sans text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none transition duration-200 ${
                        errors.email
                          ? "border-red-500 ring-red-500"
                          : "border-gray-200 focus:ring-indigo-500 focus:border-transparent"
                      }`}
                      placeholder="email@example.com"
                      disabled={isSubmitting}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-base font-sans mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="message"
                      className="block font-sans text-sm font-medium text-gray-700 mb-2"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      {...register("message")}
                      rows="4"
                      className={`w-full px-4 py-3 rounded-xl border font-sans text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none transition duration-200 resize-none ${
                        errors.message
                          ? "border-red-500 ring-red-500"
                          : "border-gray-200 focus:ring-indigo-500 focus:border-transparent"
                      }`}
                      placeholder="Your message here..."
                      disabled={isSubmitting}
                    ></textarea>
                    {errors.message && (
                      <p className="text-red-500 text-base font-sans mt-1">
                        {errors.message.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <button
                      type="submit"
                      className={`w-full px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 text-white font-sans text-base hover:from-indigo-600 hover:via-indigo-700 hover:to-indigo-800 transition-all duration-300  flex items-center justify-center gap-2${
                        isSubmitting
                          ? " opacity-60 pointer-events-none cursor-not-allowed"
                          : ""
                      }`}
                      disabled={false}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Loader size="xsmall" color="indigo-600" />
                          Sending...
                        </span>
                      ) : (
                        "Send Message"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12 text-center"
          >
            <h2 className="font-artistic text-2xl font-bold text-gray-900 mb-6">
              Other Ways to Connect
            </h2>

            <div className="space-y-4 font-sans text-lg text-gray-600">
              <a
                href="mailto:art-showcase@techness.in"
                className="inline-flex items-center space-x-2 group relative"
              >
                <svg
                  className="w-6 h-6 text-indigo-600 transition-transform group-hover:scale-110 duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium group-hover:text-indigo-700 transition-colors">
                  art-showcase@techness.in
                </span>
                <div className="absolute -bottom-0.5 left-0 right-0 h-px bg-gradient-to-r from-indigo-400/0 via-indigo-400/50 to-indigo-400/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
