import { useState } from "react";
import { motion } from "framer-motion";
import { trackFormSubmission } from "../services/analytics";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    // Track form submission
    trackFormSubmission("contact", {
      has_name: !!formData.name,
      has_email: !!formData.email,
      message_length: formData.message.length,
    });
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-96 right-1/2 transform translate-x-1/2">
          <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-100/30 to-purple-100/30 blur-3xl" />
        </div>
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
          <div className="w-96 h-96 rounded-full bg-gradient-to-br from-indigo-100/20 to-purple-100/20 blur-3xl" />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="font-artistic text-5xl sm:text-6xl font-bold text-gray-900 tracking-wide mb-4">
              Get in Touch
            </h1>
            <p className="text-xl font-sans text-gray-600 leading-relaxed">
              Have a question or want to collaborate? We'd love to hear from
              you.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/50 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden border border-gray-100"
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
                <form
                  action="https://formsubmit.co/myofficial@techness.in"
                  method="POST"
                  className="space-y-6"
                  onSubmit={handleSubmit}
                >
                  {/* Honeypot */}
                  <input
                    type="text"
                    name="_honey"
                    style={{ display: "none" }}
                  />

                  {/* Disable Captcha */}
                  <input type="hidden" name="_captcha" value="false" />

                  {/* Success page */}
                  <input
                    type="hidden"
                    name="_next"
                    value={window.location.href}
                  />

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
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 font-sans text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                      placeholder="Your name"
                    />
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
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 font-sans text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                      placeholder="email@example.com"
                    />
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
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="4"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 font-sans text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 resize-none"
                      placeholder="Your message here..."
                    ></textarea>
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="w-full px-6 py-3 rounded-full bg-indigo-600 text-white font-sans text-base hover:bg-indigo-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Send Message
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
                <span className="font-medium group-hover:text-indigo-600 transition-colors">
                  art-showcase@techness.in
                </span>
                <div className="absolute -bottom-0.5 left-0 right-0 h-px bg-gradient-to-r from-indigo-300/0 via-indigo-300/50 to-indigo-300/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
