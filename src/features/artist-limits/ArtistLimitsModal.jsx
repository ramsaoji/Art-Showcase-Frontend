import { useEffect, useRef } from "react";

import { ARTIST_LIMITS_CONFIG } from "@/features/artist-limits/config/artistLimitsFields.config";
import AppModal from "@/components/common/AppModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * ArtistLimitsModal Component
 * Admin-only modal for editing per-artist quota limits.
 * Config-driven — new limits are added via ARTIST_LIMITS_CONFIG only.
 *
 * @param {boolean} props.isOpen - Controls modal visibility.
 * @param {Function} props.onClose - Callback triggered when modal closes.
 * @param {object} props.user - Artist user object ({ artistName, email }).
 * @param {object} props.formValues - Current limit values keyed by config.key.
 * @param {Function} props.onFormChange - State setter for formValues.
 * @param {Function} props.onSave - Callback to persist the updated limits.
 * @param {Function} props.onResetToDefaults - Callback to reset all limits to platform defaults.
 * @param {boolean} props.isSaving - Disables actions while a save is in progress.
 */
export default function ArtistLimitsModal({
  isOpen,
  onClose,
  user,
  formValues,
  onFormChange,
  onSave,
  onResetToDefaults,
  isSaving,
}) {
  const firstInputRef = useRef(null);

  // Focus the first input when the modal opens for better keyboard accessibility
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      const t = setTimeout(() => firstInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      isLoading={isSaving}
      title="Quota & limits"
      description={`${user?.artistName || user?.email || "Artist"} — Set per-artist limits. These apply across all artworks for this artist.`}
      footer={
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetToDefaults}
            disabled={isSaving}
            className="text-sm text-gray-500 hover:text-indigo-600 font-medium px-2"
          >
            Reset to defaults
          </Button>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => !isSaving && onClose()}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : "Save limits"}
            </Button>
          </div>
        </div>
      }
    >
      {/* Config-driven limit fields */}
      <div className="space-y-4">
        {ARTIST_LIMITS_CONFIG.map((field, index) => (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={`limits-${field.key}`} className="text-sm font-medium text-gray-700">
              {field.label}
            </Label>
            <p className="text-xs text-gray-500">{field.description}</p>
            <Input
              ref={index === 0 ? firstInputRef : undefined}
              id={`limits-${field.key}`}
              type="number"
              min={field.min}
              max={field.max}
              value={formValues[field.key] ?? ""}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  [field.key]: e.target.value,
                }))
              }
              disabled={isSaving}
            />
          </div>
        ))}
      </div>
    </AppModal>
  );
}
