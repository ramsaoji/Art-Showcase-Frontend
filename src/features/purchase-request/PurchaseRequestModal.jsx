import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc";
import { getFriendlyErrorMessage } from "@/utils/formatters";
import LoadingButton from "@/components/common/LoadingButton";
import AppModal from "@/components/common/AppModal";

import { purchaseRequestSchema } from "@/features/purchase-request/schema/purchaseRequestValidation";
import { purchaseRequestFieldsConfig } from "@/features/purchase-request/config/purchaseRequestFields.config";
import PurchaseRequestFields from "@/features/purchase-request/components/PurchaseRequestFields";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

/**
 * PurchaseRequestModal Component
 * Facilitates submitting a purchase request for a specific artwork.
 *
 * @param {boolean} props.isOpen - Controls modal visibility.
 * @param {Function} props.onClose - Callback triggered when modal closes.
 * @param {string} props.artworkId - The ID of the current artwork.
 * @param {string} props.artworkTitle - The title of the current artwork.
 */
export default function PurchaseRequestModal({
  isOpen,
  onClose,
  artworkId,
  artworkTitle,
}) {
  const form = useForm({
    resolver: zodResolver(purchaseRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = form;

  const purchaseRequest = trpc.artwork.purchaseRequest.useMutation({
    onSuccess: () => {
      toast.success(
        "Your purchase request has been submitted! Check your inbox or spam folder for confirmation."
      );
      reset();
      onClose(); // Automatically close modal upon success
    },
    onError: (err) => {
      toast.error(getFriendlyErrorMessage(err));
    },
  });

  // Automatically reset the form whenever the modal opens or closes to prevent stale data
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (data) => {
    try {
      await purchaseRequest.mutateAsync({
        artworkId,
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        customerAddress: data.address,
      });
    } catch (err) {
      // Backend errors handled generically by onError in the TRPC mutation definition
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      isLoading={isSubmitting}
      maxWidth="max-w-xl"
      title="Purchase Request"
      description={
        <>
          Interested in <span className="font-semibold text-gray-900">{artworkTitle}</span>?{" "}
          Fill out the form below and we'll contact you soon.
        </>
      }
      footer={
        <div className="flex flex-row gap-3">
          <LoadingButton
            type="submit"
            form="purchase-form"
            loading={isSubmitting}
            loadingLabel="Submitting"
            className="flex-1 text-base shadow"
          >
            Submit Request
          </LoadingButton>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 text-base shadow-sm"
          >
            Cancel
          </Button>
        </div>
      }
    >
      <Form {...form}>
        <form id="purchase-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <PurchaseRequestFields config={purchaseRequestFieldsConfig} />
        </form>
      </Form>
    </AppModal>
  );
}
