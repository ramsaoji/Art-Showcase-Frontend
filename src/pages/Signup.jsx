import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { trpc } from "../utils/trpc";
import { motion } from "framer-motion";
import Alert from "../components/Alert";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import Loader from "../components/ui/Loader";

const schema = yup.object().shape({
  artistName: yup.string().required("Artist name is required"),
  email: yup
    .string()
    .email("Please enter a valid email address")
    .test(
      "no-dot-before-at",
      "Email cannot have a dot right before @",
      (value) => !value || !/\.@/.test(value)
    )
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords must match")
    .required("Please confirm your password"),
});

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupRole, setSignupRole] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const registerMutation = trpc.user.register.useMutation({
    onSuccess: () => {
      reset();
      setSignupSuccess(true);
      setSignupRole("ARTIST");
    },
    onError: (err) => {
      let parsed;
      try {
        parsed = JSON.parse(err.message);
      } catch {
        // fallback
      }
      if (Array.isArray(parsed)) {
        parsed.forEach((e) => {
          if (e.path && e.path[0]) {
            setFormError(e.path[0], {
              type: "server",
              message: e.message,
            });
          }
        });
      } else {
        setFormError("root.serverError", {
          type: "manual",
          message: err.message || "Registration failed",
        });
      }
    },
  });

  const onSubmit = async (data) => {
    try {
      await registerMutation.mutateAsync({
        email: data.email,
        password: data.password,
        artistName: data.artistName,
        role: "ARTIST",
      });
    } catch (error) {
      // tRPC's onError will handle this
    }
  };

  const getFieldErrorClass = (fieldName) => {
    return errors[fieldName]
      ? "border-red-500 ring-red-500 focus:ring-red-500 focus:border-red-500"
      : "border-gray-200 focus:ring-indigo-500 focus:border-transparent";
  };

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4 sm:p-6">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-96 left-1/2 transform -translate-x-1/2">
          <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-r from-indigo-100/30 to-purple-100/30 blur-3xl" />
        </div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
          <div className="w-96 h-96 rounded-full bg-gradient-to-br from-indigo-100/20 to-purple-100/20 blur-3xl" />
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg z-10"
      >
        <div className="bg-white/50 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-100 p-8 sm:p-10 space-y-8">
          <div className="text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-artistic text-3xl sm:text-4xl font-bold text-gray-900 tracking-wide"
            >
              Create Your Artist Account
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-3 text-lg font-sans text-gray-600"
            >
              Join our community of artists
            </motion.p>
          </div>

          {(registerMutation.isSuccess || errors.root?.serverError) && (
            <div className="min-h-[48px]">
              {registerMutation.isSuccess && (
                <Alert
                  type="success"
                  message={
                    signupRole === "ARTIST"
                      ? "Registration successful! Please check your email and click the verification link to activate your account."
                      : "Registration successful!"
                  }
                />
              )}
              {errors.root?.serverError && (
                <Alert type="error" message={errors.root.serverError.message} />
              )}
            </div>
          )}

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-sans font-medium text-gray-700 mb-2">
                  Artist Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("artistName")}
                  className={`w-full px-4 py-3 rounded-xl border font-sans text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none transition duration-200 ${getFieldErrorClass(
                    "artistName"
                  )}`}
                  autoFocus
                  placeholder="Enter your artist name"
                />
                {errors.artistName && (
                  <p className="text-red-500 text-sm font-sans mt-1">
                    {errors.artistName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-sans font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className={`w-full px-4 py-3 rounded-xl border font-sans text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none transition duration-200 ${getFieldErrorClass(
                    "email"
                  )}`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm font-sans mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-sans font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className={`w-full px-4 py-3 rounded-xl border font-sans text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none transition duration-200 pr-10 ${getFieldErrorClass(
                      "password"
                    )}`}
                    placeholder="Create a password (min. 8 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm font-sans mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-sans font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                    className={`w-full px-4 py-3 rounded-xl border font-sans text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none transition duration-200 pr-10 ${getFieldErrorClass(
                      "confirmPassword"
                    )}`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm font-sans mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center px-6 py-3 rounded-full bg-indigo-600 text-white font-sans text-base hover:bg-indigo-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
              disabled={isSubmitting || registerMutation.isSuccess}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <Loader size="small" className="mr-2" />
                  Signing up...
                </div>
              ) : (
                "Sign Up"
              )}
            </button>
          </motion.form>
          <div className="mt-6 text-center">
            <span className="text-gray-600 text-sm font-sans">
              Already have an account?{" "}
            </span>
            <Link
              to="/login"
              className="text-indigo-600 font-medium hover:underline font-sans"
            >
              Log in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
