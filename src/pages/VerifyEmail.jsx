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
  const resendVerification = trpc.user.resendVerificationEmail.useMutation();
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState(null);
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  // Auto-clear resendStatus after 5 seconds
  useEffect(() => {
    if (resendStatus) {
      const timer = setTimeout(() => setResendStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [resendStatus]);

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
          const friendlyMsg =
            getFriendlyErrorMessage(err) ||
            "An unexpected error occurred during verification. Please try again later.";
          setMessage(friendlyMsg);
          // Check if error is token expired
          if (
            err?.data?.code === "TOKEN_EXPIRED" ||
            (typeof friendlyMsg === "string" &&
              friendlyMsg.toLowerCase().includes("expired"))
          ) {
            setIsTokenExpired(true);
          } else {
            setIsTokenExpired(false);
          }
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
              <Alert type="success" message={message} />
              <CheckCircleIcon className="w-16 h-16 text-green-500" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-wide">
                Email Verified!
              </h1>
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
              {resendStatus ? (
                <Alert
                  type={resendStatus.type}
                  message={resendStatus.message}
                />
              ) : (
                <Alert type="error" message={message} />
              )}
              {isTokenExpired && (
                <div className="mt-4 flex flex-col items-center w-full">
                  <div className="w-full max-w-xs flex flex-col gap-2 items-center">
                    <p className="text-gray-600 text-sm font-sans mb-1 text-center">
                      If your verification link expired, enter your email to
                      resend:
                    </p>
                    <input
                      type="email"
                      className="w-full px-4 py-3 rounded-xl border font-sans text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none transition duration-200 border-gray-200 focus:ring-indigo-500 focus:border-transparent text-sm shadow-sm"
                      placeholder="Enter your email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      disabled={resendVerification.isLoading}
                    />
                    <button
                      className={`w-full mt-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 text-white font-sans font-semibold hover:from-indigo-600 hover:via-indigo-700 hover:to-indigo-800 transition-all duration-300 flex items-center justify-center gap-2${
                        resendVerification.isLoading || !resendEmail
                          ? " opacity-60 pointer-events-none cursor-not-allowed"
                          : ""
                      }`}
                      onClick={() => {
                        setResendStatus(null);
                        resendVerification.mutate(
                          { email: resendEmail },
                          {
                            onSuccess: () =>
                              setResendStatus({
                                type: "success",
                                message:
                                  "A new verification email has been sent!",
                              }),
                            onError: (err) => {
                              setResendStatus({
                                type: "error",
                                message:
                                  getFriendlyErrorMessage(err) ||
                                  "Failed to resend email.",
                              });
                            },
                          }
                        );
                      }}
                      disabled={resendVerification.isLoading || !resendEmail}
                    >
                      {resendVerification.isLoading && (
                        <Loader size="xsmall" color="indigo-600" />
                      )}
                      <span>
                        {resendVerification.isLoading
                          ? "Sending..."
                          : "Resend Verification Email"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
              <div className="my-6 w-full max-w-xs border-t border-gray-200" />
              <Link
                to="/contact"
                className="w-full max-w-xs px-6 py-3 rounded-xl bg-gray-600 text-white font-sans font-semibold shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300 text-base text-center"
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
