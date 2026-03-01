import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import FormCard from "@/components/common/FormCard";
import { formContainerMotion } from "@/lib/motionConfigs";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { trackFormSubmission } from "@/services/analytics";
import { trpcClient } from "@/lib/trpc";
import { getFriendlyErrorMessage } from "@/utils/formatters";
import PageBackground from "@/components/common/PageBackground";
import PageHeader from "@/components/common/PageHeader";
import LoadingButton from "@/components/common/LoadingButton";

// Feature: contact — schema + field config + renderer
import { contactSchema } from "@/features/contact/schema/contactValidation";
import { contactFieldsConfig } from "@/features/contact/config/contactFields.config";
import ContactFormFields from "@/features/contact/components/ContactFormFields";

// shadcn components
import { Form } from "@/components/ui/form";

const successMotion = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
};

// formContainerMotion imported from @/lib/motionConfigs

/**
 * Contact Page
 * Allows visitors to send a message to the platform team.
 * Uses react-hook-form + zod validation + shadcn Form components.
 */
const Contact = () => {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = form;

  const onSubmit = async (data) => {
    try {
      trackFormSubmission("contact", {
        has_name: !!data.name,
        has_email: !!data.email,
        message_length: data.message.length,
      });
      await trpcClient.misc.sendContactMessage.mutate(data);
      setSubmitted(true);
      reset();
    } catch (err) {
      // S4: user-triggered error → toast, not inline <Alert>
      toast.error(getFriendlyErrorMessage(err));
    }
  };

  return (
    <div className="relative min-h-screen bg-white/50">
      <PageBackground />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <PageHeader
            title="Get in Touch"
            subtitle="Have a question or want to collaborate? We'd love to hear from you."
          />

          <FormCard maxWidth="3xl" noPadding className="overflow-hidden mx-0">
            <div className="p-8">
              {submitted ? (
                <motion.div {...successMotion} className="text-center py-12">
                  <h2 className="font-artistic text-3xl font-bold text-gray-900 mb-4">
                    Thank You!
                  </h2>
                  <p className="font-sans text-lg text-gray-600">
                    Your message has been sent successfully. We'll get back to you soon.
                  </p>
                </motion.div>
              ) : (
                <Form {...form}>
                  <form
                    className="space-y-6"
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                  >
                    {/* Honeypot — hidden from real users, traps bots */}
                    <input type="text" name="_honey" style={{ display: "none" }} />

                    {/* Config-driven fields — add/remove/reorder via contactFieldsConfig */}
                    <ContactFormFields
                      config={contactFieldsConfig}
                      isSubmitting={isSubmitting}
                    />

                    <LoadingButton
                      type="submit"
                      loading={isSubmitting}
                      loadingLabel="Sending..."
                      className="w-full"
                    >
                      Send Message
                    </LoadingButton>
                  </form>
                </Form>
              )}
            </div>
          </FormCard>

          {/* Contact Information */}
          <motion.div
            {...formContainerMotion}
            className="mt-12 text-center"
          >
            <h2 className="font-artistic text-2xl font-bold text-gray-900 mb-6">
              Other Ways to Connect
            </h2>
            <div className="space-y-4 font-sans text-lg text-gray-600">
              <a
                href="mailto:art-showcase@techness.in"
                className="inline-flex items-center space-x-2 group relative"
              >
                <svg
                  className="w-6 h-6 text-indigo-600 transition-transform group-hover:scale-110 duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium group-hover:text-indigo-700 transition-colors">
                  art-showcase@techness.in
                </span>
                <div className="absolute -bottom-0.5 left-0 right-0 h-px bg-gradient-to-r from-indigo-400/0 via-indigo-400/50 to-indigo-400/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
