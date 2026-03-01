import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import Loader from "@/components/common/Loader";
import Alert from "@/components/common/Alert";
import PageBackground from "@/components/common/PageBackground";
import LoadingButton from "@/components/common/LoadingButton";
import CheckCircleIcon from "@heroicons/react/24/outline/CheckCircleIcon";
import XCircleIcon from "@heroicons/react/24/outline/XCircleIcon";
import { getFriendlyErrorMessage } from "@/utils/formatters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import FormCard from "@/components/common/FormCard";

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
      <PageBackground />
      <FormCard maxWidth="4xl" className="space-y-8 text-center z-10">
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
              <Button asChild className="mt-4">
                <Link to="/login">Proceed to Login</Link>
              </Button>
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
                      resend: <span className="text-red-500">*</span>
                    </p>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      disabled={resendVerification.isLoading}
                      className="w-full"
                    />
                    <LoadingButton
                      loading={resendVerification.isLoading}
                      loadingLabel="Sending..."
                      disabled={!resendEmail}
                      onClick={() => {
                        setResendStatus(null);
                        resendVerification.mutate(
                          { email: resendEmail },
                          {
                            onSuccess: () =>
                              setResendStatus({
                                type: "success",
                                message: "A new verification email has been sent!",
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
                      className="w-full mt-2"
                    >
                      Resend Verification Email
                    </LoadingButton>
                  </div>
                </div>
              )}
              <div className="my-6 w-full max-w-xs border-t border-gray-200" />
              <Button
                asChild
                variant="outline"
                className="w-full max-w-xs"
              >
                <Link to="/contact">Contact Support</Link>
              </Button>
            </div>
          )}
      </FormCard>
    </div>
  );
}
