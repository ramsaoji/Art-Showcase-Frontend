import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Alert from "../components/Alert";
import Loader from "../components/ui/Loader";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { getFriendlyErrorMessage } from "../utils/formatters";

const schema = yup.object().shape({
  email: yup
    .string()
    .email("Please enter a valid email")
    .test(
      "no-dot-before-at",
      "Email cannot have a dot right before @",
      (value) => !value || !/\.@/.test(value)
    )
    .required("Email is required"),
  password: yup.string().required("Password is required"),
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    login,
    isSuperAdmin,
    isArtist,
    user,
    loading: authLoading,
    error: authError,
    clearError,
  } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || "/gallery";
      navigate(from, { replace: true });
    }
  }, [user, isSuperAdmin, isArtist, navigate, location]);

  // Handle auth context errors
  useEffect(() => {
    if (authError) {
      const timer = setTimeout(() => {
        clearError();
      }, 3000); // Clear error after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [authError, clearError]);

  const onSubmit = async (data) => {
    if (authError) clearError();
    try {
      await login(data.email, data.password);
      // Navigation is handled by the useEffect above
    } catch (err) {
      let parsed;
      try {
        parsed = JSON.parse(err.message);
      } catch {
        // fallback
      }
      if (Array.isArray(parsed)) {
        parsed.forEach((e) => {
          if (e.path && e.path[0]) {
            setError(e.path[0], {
              type: "server",
              message: e.message,
            });
          }
        });
      } else {
        setError("root.serverError", {
          type: "manual",
          message: getFriendlyErrorMessage(err),
        });
      }
    }
  };

  const getFieldErrorClass = (fieldName) => {
    return errors[fieldName]
      ? "border-red-500 ring-red-500 focus:ring-red-500 focus:border-red-500"
      : "border-gray-200 focus:ring-indigo-500 focus:border-transparent";
  };

  // Only show server-side or auth-related errors in the main alert
  const displayError =
    errors.root?.serverError?.message ||
    (authError ? getFriendlyErrorMessage(authError) : "");

  return (
    <div className="relative min-h-screen px-4 sm:px-6 lg:px-8 py-12 bg-white/50">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-96 left-1/2 transform -translate-x-1/2">
          <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-100/30 to-purple-100/30 blur-3xl" />
        </div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
          <div className="w-96 h-96 rounded-full bg-gradient-to-br from-indigo-100/20 to-purple-100/20 blur-3xl" />
        </div>
      </div>
      <div className="relative">
        <div className="">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl lg:text-6xl font-bold mb-4 font-artistic text-center tracking-wide text-gray-900">
              Artist Login
            </h1>
            <p className="text-lg sm:text-xl font-sans text-gray-600 leading-relaxed">
              Sign in to manage artworks
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-2xl mx-auto bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-100 p-8 sm:p-10"
          >
            <div className="space-y-6">
              {/* Reserve space for alert */}
              {displayError && (
                <div className="min-h-[48px]">
                  <Alert type="error" message={displayError} />
                </div>
              )}
              <form
                className="space-y-6"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
              >
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="email-address"
                      className="block text-sm font-medium text-gray-700 mb-2 font-sans"
                    >
                      Email address
                    </label>
                    <input
                      id="email-address"
                      type="email"
                      autoComplete="email"
                      {...register("email")}
                      className={`w-full px-4 py-3 rounded-xl border font-sans text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none transition duration-200 ${getFieldErrorClass(
                        "email"
                      )}`}
                      placeholder="Enter your email"
                      autoFocus
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm font-sans mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2 font-sans"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        {...register("password")}
                        className={`w-full px-4 py-3 rounded-xl border font-sans text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none transition duration-200 pr-10 ${getFieldErrorClass(
                          "password"
                        )}`}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500 transition-colors"
                      >
                        {showPassword ? (
                          <EyeSlashIcon
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        ) : (
                          <EyeIcon className="h-5 w-5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-sm font-sans mt-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting || authLoading}
                    className="w-full inline-flex items-center justify-center px-6 py-3 rounded-full bg-indigo-600 text-white font-sans text-base hover:bg-indigo-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <Loader size="small" className="mr-2" />
                        Signing in...
                      </div>
                    ) : (
                      "Sign in"
                    )}
                  </button>
                </div>
              </form>
              <div className="mt-6 text-center">
                <span className="text-gray-600 text-sm font-sans">
                  Don't have an account?{" "}
                </span>
                <Link
                  to="/signup"
                  className="text-indigo-600 font-medium hover:underline font-sans"
                >
                  Sign up as Artist
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
