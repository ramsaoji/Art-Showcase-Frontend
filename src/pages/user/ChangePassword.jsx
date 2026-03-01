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
import { changePasswordSchema } from "@/features/auth/schema/authValidation";
import { changePasswordFieldsConfig } from "@/features/auth/config/changePasswordFields.config";
import AuthFormFields from "@/features/auth/components/AuthFormFields";

// shadcn components
import { Form } from "@/components/ui/form";

/**
 * ChangePassword Page
 * Allows authenticated users to change their password securely.
 */
export default function ChangePassword() {
  const form = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    setError,
    reset,
  } = form;

  const changePasswordMutation = trpc.user.changePassword.useMutation({
    onSuccess: () => {
      reset();
      toast.success("Password updated successfully!");
    },
    onError: (err) => {
      // Parse Zod validation array from the server if applicable
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
          // Fallback if parsing fails
        }
      }

      // Handle explicitly specified error cases
      if (err.message.toLowerCase().includes("invalid current password")) {
        setError("currentPassword", {
          type: "manual",
          message: getFriendlyErrorMessage(err),
        });
        return;
      }

      // Fallback for all other errors
      toast.error(getFriendlyErrorMessage(err));
    },
  });

  const onSubmit = (data) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="relative min-h-screen px-4 sm:px-6 lg:px-8 py-12 bg-white/50">
      <PageBackground />

      <div className="relative">
        <PageHeader title="Change Password" subtitle="Keep your account secure" />

        <FormCard>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              {/* Config-driven fields — add/remove/reorder via changePasswordFieldsConfig */}
              <AuthFormFields config={changePasswordFieldsConfig} />

              {/* Submit Button */}
              <div className="pt-4">
                <LoadingButton
                  type="submit"
                  loading={isSubmitting}
                  loadingLabel="Updating..."
                  className="w-full"
                >
                  Update Password
                </LoadingButton>
              </div>
            </form>
          </Form>
        </FormCard>
      </div>
    </div>
  );
}
