import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { getFriendlyErrorMessage } from "@/utils/formatters";
import PageBackground from "@/components/common/PageBackground";
import PageHeader from "@/components/common/PageHeader";
import FormCard from "@/components/common/FormCard";
import LoadingButton from "@/components/common/LoadingButton";

// Feature: auth — schema + field config + renderer
import { loginSchema } from "@/features/auth/schema/authValidation";
import { loginFieldsConfig } from "@/features/auth/config/loginFields.config";
import AuthFormFields from "@/features/auth/components/AuthFormFields";

// shadcn components
import { Form } from "@/components/ui/form";

/**
 * Login Page
 * Authenticates artists and admins into the application suite.
 */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, error: authError, clearError } = useAuth();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = form;

  // Effect: Route redirection upon successful login verification
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || "/gallery";
      navigate(from, { replace: true });
    }
  }, [user?.id, navigate, location]);

  // Effect: Clear stale authentication errors periodically
  useEffect(() => {
    if (authError) {
      const timer = setTimeout(() => {
        clearError();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [authError, clearError]);

  // Effect: Fire error toast globally when auth context changes
  useEffect(() => {
    if (authError) {
      toast.error(getFriendlyErrorMessage(authError));
    }
  }, [authError]);

  const onSubmit = async (data) => {
    if (authError) clearError();
    try {
      await login(data.email, data.password);
      // Navigation is natively handled by the useEffect above
    } catch (err) {
      let parsed;
      try {
        parsed = JSON.parse(err.message);
      } catch {
        // Fallback for non-zod errors
      }

      // If server returns multiple scoped field errors, set them on the form fields.
      // Broad auth failures are already handled by the authError useEffect above.
      if (Array.isArray(parsed)) {
        parsed.forEach((e) => {
          if (e.path && e.path[0]) {
            setError(e.path[0], {
              type: "server",
              message: e.message,
            });
          }
        });
      }
    }
  };

  return (
    <div className="relative min-h-screen px-4 sm:px-6 lg:px-8 py-12 bg-white/50">
      <PageBackground />

      <div className="relative">
        <PageHeader title="Artist Login" subtitle="Sign in to manage artworks" />

        <FormCard>
          <div className="space-y-6">
            <Form {...form}>
              <form
                className="space-y-6"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
              >
                {/* Config-driven fields — add/remove/reorder via loginFieldsConfig */}
                <div className="space-y-4">
                  <AuthFormFields config={loginFieldsConfig} />
                </div>

                {/* Submit Frame */}
                <div>
                  <LoadingButton
                    type="submit"
                    loading={isSubmitting}
                    loadingLabel="Signing in..."
                    className="w-full"
                  >
                    Sign in
                  </LoadingButton>
                </div>
              </form>
            </Form>

            {/* Redirect Footer */}
            <div className="mt-6 text-center">
              <span className="text-gray-600 text-sm font-sans">
                Don't have an account?{" "}
              </span>
              <Link
                to="/signup"
                className="text-indigo-600 font-medium hover:text-indigo-700 hover:underline font-sans transition-colors duration-300"
              >
                Sign up as Artist
              </Link>
            </div>
          </div>
        </FormCard>
      </div>
    </div>
  );
}
