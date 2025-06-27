import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { trpc } from "../../utils/trpc";
import { motion } from "framer-motion";
import Alert from "../../components/Alert";
import Loader from "../../components/ui/Loader";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { getFriendlyErrorMessage } from "../../utils/formatters";

const schema = yup.object().shape({
  currentPassword: yup.string().required("Current password is required"),
  newPassword: yup
    .string()
    .min(8, "New password must be at least 8 characters")
    .notOneOf(
      [yup.ref("currentPassword"), null],
      "New password cannot be the same as the current one."
    )
    .required("New password is required"),
  confirmNewPassword: yup
    .string()
    .oneOf([yup.ref("newPassword"), null], "Passwords must match")
    .required("Please confirm your new password"),
});

export default function ChangePassword() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    // mode: "onTouched",
  });

  const changePasswordMutation = trpc.user.changePassword.useMutation({
    onSuccess: () => {
      reset();
    },
    onError: (err) => {
      // Handle Zod validation errors from the server
      if (err.data?.code === "BAD_REQUEST") {
        try {
          const errors = JSON.parse(err.message);
          if (Array.isArray(errors)) {
            errors.forEach((e) => {
              if (e.path && e.path.length > 0) {
                setFormError(e.path[0], {
                  type: "server",
                  message: e.message,
                });
              }
            });
            return;
          }
        } catch (e) {
          console.error("Failed to parse error message:", e);
        }
      }

      // Handle other specific errors
      if (err.message.toLowerCase().includes("invalid current password")) {
        setFormError("currentPassword", {
          type: "manual",
          message: getFriendlyErrorMessage(err),
        });
        return;
      }

      // For all other errors, show a generic message
      setFormError("root.serverError", {
        type: "manual",
        message: getFriendlyErrorMessage(err),
      });
    },
  });

  const onSubmit = (data) => {
    changePasswordMutation.mutate(data);
  };

  const getFieldErrorClass = (fieldName) => {
    return errors[fieldName]
      ? "border-red-500 ring-red-500 focus:ring-red-500 focus:border-red-500"
      : "border-gray-200 focus:ring-indigo-500 focus:border-transparent";
  };

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl lg:text-6xl font-bold mb-4 font-artistic text-center tracking-wide text-gray-900">
            Change Password
          </h1>
          <p className="text-lg sm:text-xl font-sans text-gray-600 leading-relaxed">
            Keep your account secure
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-2xl mx-auto bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-100 p-8 sm:p-10"
        >
          <div className="space-y-6">
            {(changePasswordMutation.isSuccess || errors.root?.serverError) && (
              <div className="min-h-[48px]">
                {changePasswordMutation.isSuccess && (
                  <Alert
                    type="success"
                    message="Password updated successfully!"
                  />
                )}
                {errors.root?.serverError && (
                  <Alert
                    type="error"
                    message={errors.root.serverError.message}
                  />
                )}
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
              noValidate
            >
              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-sans font-medium text-gray-700 mb-2">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      {...register("currentPassword")}
                      className={`w-full px-4 py-3 rounded-xl border font-sans text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none transition duration-200 ${getFieldErrorClass(
                        "currentPassword"
                      )}`}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((p) => !p)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
                    >
                      {showCurrentPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="text-red-500 text-sm font-sans mt-1">
                      {errors.currentPassword.message}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-sans font-medium text-gray-700 mb-2">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      {...register("newPassword")}
                      className={`w-full px-4 py-3 rounded-xl border font-sans text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none transition duration-200 ${getFieldErrorClass(
                        "newPassword"
                      )}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((p) => !p)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
                    >
                      {showNewPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-red-500 text-sm font-sans mt-1">
                      {errors.newPassword.message}
                    </p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-sans font-medium text-gray-700 mb-2">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      {...register("confirmNewPassword")}
                      className={`w-full px-4 py-3 rounded-xl border font-sans text-gray-900 placeholder-gray-400 focus:ring-2 focus:outline-none transition duration-200 ${getFieldErrorClass(
                        "confirmNewPassword"
                      )}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmNewPassword && (
                    <p className="text-red-500 text-sm font-sans mt-1">
                      {errors.confirmNewPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-semibold rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all duration-300 font-sans"
                >
                  {isSubmitting ? (
                    <Loader size="small" color="white" />
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
