import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { trpc } from "../utils/trpc";
import Loader from "../components/ui/Loader";
import Alert from "../components/Alert";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { getFriendlyErrorMessage } from "../utils/formatters";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  const verifyEmail = trpc.user.verifyEmail.useMutation();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(
        "No verification token provided. Please check your email or contact support if the issue persists."
      );
      return;
    }
    verifyEmail.mutate(
      { token },
      {
        onSuccess: (data) => {
          setStatus("success");
          setMessage(
            "Your email has been verified successfully! Your account is now pending approval from an administrator."
          );
          setTimeout(() => navigate("/login"), 5000);
        },
        onError: (err) => {
          setStatus("error");
          setMessage(
            getFriendlyErrorMessage(err) ||
              "An unexpected error occurred during verification. Please try again later."
          );
        },
      }
    );
    // eslint-disable-next-line
  }, [token]);

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center p-4 sm:p-6 bg-white/50">
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
        className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 z-10"
      >
        <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-100 p-8 sm:p-10 space-y-8 text-center">
          {status === "loading" && (
            <>
              <Loader />
              <p className="text-lg font-medium text-gray-600">
                Verifying your email...
              </p>
            </>
          )}
          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircleIcon className="w-16 h-16 text-green-500" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-wide">
                Email Verified!
              </h1>
              <Alert type="success" message={message} />
              <Link
                to="/login"
                className="mt-4 inline-block px-6 py-3 text-base font-medium text-white bg-indigo-600 rounded-xl shadow-md hover:bg-indigo-700  font-sans transition-all duration-300 ease-in-out"
              >
                Proceed to Login
              </Link>
            </div>
          )}
          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <XCircleIcon className="w-16 h-16 text-red-500" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-wide">
                Verification Failed
              </h1>
              <Alert type="error" message={message} />
              <Link
                to="/contact"
                className="mt-4 inline-block px-6 py-3 text-base font-medium text-white bg-gray-600 rounded-xl shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 font-sans transition-all duration-300 ease-in-out"
              >
                Contact Support
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
