import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { trpc } from "../utils/trpc";
import Loader from "../components/ui/Loader";
import Alert from "../components/Alert";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

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
          localStorage.setItem("token", data.token);
          setStatus("success");
          setMessage(
            "Your email has been verified successfully! Your account is now pending approval from an administrator."
          );
          setTimeout(() => navigate("/login"), 5000);
        },
        onError: (err) => {
          setStatus("error");
          setMessage(
            err.message ||
              "An unexpected error occurred during verification. Please try again later."
          );
        },
      }
    );
    // eslint-disable-next-line
  }, [token]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50/50">
      <div className="w-full max-w-md p-8 space-y-6 text-center">
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
            <h1 className="text-2xl font-bold text-gray-800">
              Email Verified!
            </h1>
            <Alert type="success" message={message} />
            <Link
              to="/login"
              className="mt-4 inline-block px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-sans"
            >
              Proceed to Login
            </Link>
          </div>
        )}
        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <XCircleIcon className="w-16 h-16 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-800">
              Verification Failed
            </h1>
            <Alert type="error" message={message} />
            <Link
              to="/contact"
              className="mt-4 inline-block px-6 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 font-sans"
            >
              Contact Support
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
