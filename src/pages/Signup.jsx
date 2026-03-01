import { useCallback } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc";
import { getFriendlyErrorMessage } from "@/utils/formatters";
import PageBackground from "@/components/common/PageBackground";
import PageHeader from "@/components/common/PageHeader";
import FormCard from "@/components/common/FormCard";
import LoadingButton from "@/components/common/LoadingButton";

// Feature: auth — schema + field config + renderer
import { signupSchema } from "@/features/auth/schema/authValidation";
import { signupFieldsConfig } from "@/features/auth/config/signupFields.config";
import AuthFormFields from "@/features/auth/components/AuthFormFields";

// shadcn components
import { Form } from "@/components/ui/form";

/**
 * Signup Page
 * Allows new artists to register for an account using TRPC routing.
 */
export default function Signup() {
  const form = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      artistName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    setError,
    reset,
  } = form;

  const registerMutation = trpc.user.register.useMutation({
    onSuccess: () => {
      reset();
      toast.success(
        "Registration successful! Please check your email and click the verification link to activate your account."
      );
    },
    onError: (err) => {
      // Parse detailed Zod validation errors from the backend response
      if (err.data?.code === "BAD_REQUEST") {
        try {
          const parsedErrors = JSON.parse(err.message);
          if (Array.isArray(parsedErrors)) {
            parsedErrors.forEach((e) => {
              if (e.path && e.path.length > 0) {
                setError(e.path[0], {
                  type: "server",
                  message: e.message,
                });
              }
            });
            return;
          }
        } catch (e) {
          // Fall through to generic error layout if JSON parsing fails
        }
      }

      // Handle broad server/database errors visually
      toast.error(getFriendlyErrorMessage(err));
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
      // Handled entirely by mapping within TRPC's onError method
    }
  };

  return (
    <div className="relative min-h-screen px-4 sm:px-6 lg:px-8 py-12 bg-white/50">
      <PageBackground />

      <div className="relative">
        <PageHeader
          title="Create Artist Account"
          subtitle="Join our community of artists"
          as="h2"
        />

        <FormCard maxWidth="2xl">
          <div className="space-y-6">
            <Form {...form}>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
                noValidate
              >
                {/* Config-driven fields — add/remove/reorder via signupFieldsConfig */}
                <div className="space-y-4">
                  <AuthFormFields config={signupFieldsConfig} />
                </div>

                {/* Submit Action */}
                <LoadingButton
                  type="submit"
                  loading={isSubmitting}
                  loadingLabel="Signing up..."
                  className="w-full"
                >
                  Sign Up
                </LoadingButton>
              </form>
            </Form>

            {/* Redirect Options Footer */}
            <div className="mt-6 text-center">
              <span className="text-gray-600 text-sm font-sans">
                Already have an account?{" "}
              </span>
              <Link
                to="/login"
                className="text-indigo-600 font-medium hover:text-indigo-700 hover:underline font-sans transition-colors duration-300"
              >
                Log in
              </Link>
            </div>
          </div>
        </FormCard>
      </div>
    </div>
  );
}
