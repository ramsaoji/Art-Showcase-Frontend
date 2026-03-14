import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import Loader from "@/components/common/Loader";
import Alert from "@/components/common/Alert";
import PageBackground from "@/components/common/PageBackground";
import PageHeader from "@/components/common/PageHeader";
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
  const previewMode = searchParams.get("preview");
  const isDevPreview = import.meta.env.DEV && !token;
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
    if (isDevPreview) {
      if (previewMode === "success") {
        setStatus("success");
        setMessage(
          "Preview mode: your email has been verified successfully! Your account is now pending approval from an administrator."
        );
        setIsTokenExpired(false);
        return;
      }

      if (previewMode === "expired") {
        setStatus("error");
        setMessage(
          "Preview mode: this verification link has expired. Enter your email below to resend a new one."
        );
        setIsTokenExpired(true);
        return;
      }

      if (previewMode === "loading") {
        setStatus("loading");
        setMessage("");
        setIsTokenExpired(false);
        return;
      }

      setStatus("error");
      setMessage(
        "Preview mode: open this page with ?preview=success, ?preview=expired, or ?preview=loading to inspect each state."
      );
      setIsTokenExpired(false);
      return;
    }

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
  }, [isDevPreview, previewMode, token]);

  return (
    <div className="relative h-full min-h-screen overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-8 py-12 bg-white/50">
      <PageBackground />
      <div className="relative">
        <PageHeader
          title="Verify Your Email"
          subtitle="Complete account activation to continue into the gallery"
        />

        <FormCard maxWidth="2xl" className="relative z-10 text-center">
          {status === "loading" && (
            <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 ring-1 ring-indigo-100">
                <Loader />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-wide">
                  Verifying your email
                </h2>
                <p className="text-base font-sans text-gray-600 leading-relaxed">
                  Please wait while we confirm your verification link.
                </p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="mx-auto flex max-w-lg flex-col items-center gap-5 py-2">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 ring-1 ring-green-100">
                <CheckCircleIcon className="w-11 h-11 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-wide">
                  Email Verified
                </h2>
                <p className="text-base font-sans text-gray-600 leading-relaxed">
                  Your account is now ready for the next step.
                </p>
              </div>
              <Alert
                type="success"
                message={message}
                className="w-full max-w-md text-left"
              />
              <Button asChild className="mt-2 w-full max-w-xs">
                <Link to="/login">Proceed to Login</Link>
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="mx-auto flex max-w-lg flex-col items-center gap-5 py-2">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 ring-1 ring-red-100">
                <XCircleIcon className="w-11 h-11 text-red-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-wide">
                  Verification Failed
                </h2>
                <p className="text-base font-sans text-gray-600 leading-relaxed">
                  The link may be invalid, expired, or incomplete.
                </p>
              </div>

              {resendStatus ? (
                <Alert
                  type={resendStatus.type}
                  message={resendStatus.message}
                  className="w-full max-w-md text-left"
                />
              ) : (
                <Alert
                  type="error"
                  message={message}
                  className="w-full max-w-md text-left"
                />
              )}

              {isTokenExpired && (
                <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-gray-50/80 p-5 text-left">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        Resend verification email
                      </h3>
                      <p className="text-sm font-sans text-gray-600 leading-relaxed">
                        Enter the email address you used during signup and we&apos;ll send a fresh verification link.
                      </p>
                    </div>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      disabled={resendVerification.isLoading}
                      className="w-full bg-white"
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
                      className="w-full"
                    >
                      Resend Verification Email
                    </LoadingButton>
                  </div>
                </div>
              )}

              <div className="my-1 w-full max-w-xs border-t border-gray-200" />
              <Button asChild variant="outline" className="w-full max-w-xs">
                <Link to="/contact">Contact Support</Link>
              </Button>
            </div>
          )}
        </FormCard>
      </div>
    </div>
  );
}
