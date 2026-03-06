import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ArtistSelect from "@/components/artwork/ArtistSelect";
import Loader from "@/components/common/Loader";
import { artworkFieldsConfig } from "../config/artworkFields.config";
import SparklesIcon from "@heroicons/react/24/outline/SparklesIcon";


/**
 * ArtworkFormFields
 * Config-driven field renderer. Maps over artworkFieldsConfig, filters by role/mode,
 * and renders the appropriate shadcn FormField for each entry.
 *
 * Special field types handled inline:
 *   - "artist-select"    → <ArtistSelect> component
 *   - "dimensions-group" → Two sub-fields (width × height) with preview
 *   - "toggles-group"   → Featured + Sold <Switch> row
 *   - "select" with hasExpiryConditional → Status select with expiry-aware disabled options
 *
 * @param {object} props
 * @param {boolean} props.isSuperAdmin - Controls adminOnly field visibility.
 * @param {boolean} props.isArtist - Controls AI quota hint display.
 * @param {object|null} props.initialData - Edit mode data (controls createOnly field visibility).
 * @param {object|null} props.editArtistUsageStats - Admin edit mode: artist AI usage stats.
 * @param {object|null} props.selectedArtistUploadData - Admin add mode: selected artist stats.
 * @param {string} props.selectedArtistName - Display name of the admin-selected artist.
 * @param {object|null} props.backendLimits - Backend config limits object.
 * @param {number|null} props.aiRemaining - Artist's remaining AI description uses today.
 * @param {number|null} props.aiLimit - Artist's total daily AI description limit.
 * @param {boolean} props.aiLoading - Whether an AI description is being generated.
 * @param {string} props.aiError - AI description error message, if any.
 * @param {Array} props.images - Current images array (used to guard AI button).
 * @param {Function} props.handleAIDescription - Triggers AI description generation.
 * @param {object} props.watchedValues - Live watched form values (for conditional renders).
 * @param {Function} props.setArtistId - Parent setter for the selected artist ID.
 * @param {boolean} props.artistFieldTouched - Whether the artist field has been interacted with.
 * @param {boolean} props.isSubmitted - Whether the form has been submitted (controls error display).
 */
export default function ArtworkFormFields({
  isSuperAdmin,
  isArtist,
  initialData,
  editArtistUsageStats,
  selectedArtistUploadData,
  selectedArtistName,
  backendLimits,
  aiRemaining,
  aiLimit,
  aiLoading,
  aiError,
  images,
  handleAIDescription,
  watchedValues,
  setArtistId,
  artistFieldTouched,
  isSubmitted,
}) {
  const { control, trigger, setValue } = useFormContext();

  /**
   * Filters the config to only the fields the current user should see.
   * adminOnly: hidden from non-admins.
   * createOnly: hidden in edit mode (initialData present).
   */
  const visibleFields = artworkFieldsConfig.filter((field) => {
    if (field.adminOnly && !isSuperAdmin) return false;
    if (field.createOnly && !!initialData) return false;
    return true;
  });

  // ─── Field renderer switch ─────────────────────────────────────────────────

  /**
   * Renders the appropriate JSX for a given field config entry.
   * @param {object} fieldConfig
   */
  const renderField = (fieldConfig) => {
    const { name, type } = fieldConfig;

    // ── Special composite blocks ───────────────────────────────────────────
    if (type === "dimensions-group") return renderDimensionsGroup();
    if (type === "toggles-group") return renderTogglesGroup();
    if (type === "artist-select") return renderArtistSelect(fieldConfig);

    // ── Standard shadcn FormField ──────────────────────────────────────────
    return (
      <FormField
        key={name}
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className={fieldConfig.colSpan === 1 ? "col-span-1 sm:col-span-1" : "col-span-1 sm:col-span-2"}>
            {renderLabel(fieldConfig, field)}
            <FormControl>{renderInput(fieldConfig, field)}</FormControl>
            {/* AI button row — only for description field */}
            {fieldConfig.hasAIButton && renderAIRow()}
            {/* AI error */}
            {fieldConfig.hasAIButton && aiError && (
              <p className="text-sm text-red-600 font-sans">{aiError}</p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  // ─── Label renderer: adds AI usage hint for description field ─────────────
  const renderLabel = (fieldConfig, _field) => {
    if (fieldConfig.name === "description") {
      return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <FormLabel>
            {fieldConfig.label}{" "}
            {fieldConfig.required && <span className="text-red-500">*</span>}
          </FormLabel>
          {/* AI usage hint — shows based on context */}
          {isSuperAdmin && initialData && editArtistUsageStats ? (
            <span className="text-xs text-gray-500">
              AI usage: {editArtistUsageStats.aiDescriptionUsed ?? 0}/
              {editArtistUsageStats.aiDescriptionDailyLimit ?? backendLimits?.aiDescriptionDaily ?? 5} today
            </span>
          ) : isSuperAdmin && !initialData && selectedArtistUploadData ? (
            <span className="text-xs text-gray-500">
              {selectedArtistName}'s AI usage: {selectedArtistUploadData.aiDescriptionUsed ?? 0}/
              {selectedArtistUploadData.aiDescriptionDailyLimit ?? backendLimits?.aiDescriptionDaily ?? 5} today
            </span>
          ) : isArtist && typeof aiRemaining === "number" && typeof aiLimit === "number" ? (
            <span className="text-xs text-gray-500">
              AI usage: {aiLimit - aiRemaining}/{aiLimit} today
            </span>
          ) : null}
        </div>
      );
    }

    // Status field label (no asterisk for optional admin fields)
    return (
      <FormLabel>
        {fieldConfig.label}
        {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
      </FormLabel>
    );
  };

  // ─── Input renderer — dispatches on field type ─────────────────────────────
  const renderInput = (fieldConfig, field) => {
    const { type, inputType, placeholder, inputProps, rows, selectOptions, selectLabels, hasExpiryConditional } = fieldConfig;

    switch (type) {
      case "input":
        return (
          <Input
            type={inputType || "text"}
            placeholder={placeholder}
            {...(inputProps || {})}
            {...field}
          />
        );

      case "textarea":
        return (
          <Textarea
            rows={rows || 4}
            placeholder={placeholder}
            className="resize-none"
            {...field}
          />
        );

      case "datetime-local":
        return (
          <DateTimePicker
            value={field.value ?? ""}
            onChange={field.onChange}
          />
        );

      case "select": {
        // Status field: conditionally disables ACTIVE/INACTIVE when expiry is past
        const isPastExpiry =
          hasExpiryConditional &&
          watchedValues.expiresAt &&
          new Date(watchedValues.expiresAt) < new Date();

        return (
          <>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger
                className={`w-full${isPastExpiry ? " border-red-500 focus-visible:ring-red-500" : ""}`}
              >
                <SelectValue placeholder={placeholder || "Select..."} />
              </SelectTrigger>
              <SelectContent>
                {selectOptions.map((opt) => (
                  <SelectItem
                    key={opt}
                    value={opt}
                    disabled={
                      isPastExpiry && (opt === "ACTIVE" || opt === "INACTIVE")
                    }
                  >
                    {selectLabels?.[opt] ?? opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Expiry warning hint */}
            {isPastExpiry &&
              (watchedValues.status === "ACTIVE" || watchedValues.status === "INACTIVE") && (
                <p className="text-sm text-red-600 mt-1">
                  Cannot be active/inactive with a past expiry date.
                </p>
              )}
          </>
        );
      }

      case "switch":
        return (
          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
        );

      default:
        return null;
    }
  };

  // ─── AI Generate button row (rendered below description field) ────────────
  const renderAIRow = () => (
    <div className="flex flex-row items-center gap-x-2 !mt-2">
      <Button
        type="button"
        size="sm"
        onClick={handleAIDescription}
        disabled={aiLoading || images?.length === 0 || (isArtist && aiRemaining <= 0)}
        title={images?.length === 0 ? "Please upload at least one image first to generate AI description" : undefined}
        className="min-w-[130px] whitespace-nowrap"
      >
        {aiLoading ? (
          <>
            <Loader size="xsmall" />
            Generating...
          </>
        ) : (
          <>
            <SparklesIcon className="w-4 h-4" />
            AI Generate
          </>
        )}
      </Button>
      {isArtist && aiRemaining <= 0 && !aiLoading && (
        <span className="text-xs text-red-600 font-sans">Daily AI limit reached</span>
      )}
      {images?.length === 0 && !aiLoading && (
        <span className="text-xs text-gray-500 font-sans break-words max-w-[70vw]">Upload at least one image to use AI description generation</span>
      )}
    </div>
  );

  // ─── Artist Select (admin create mode) ────────────────────────────────────
  const renderArtistSelect = (fieldConfig) => (
    <FormField
      key={fieldConfig.name}
      control={control}
      name={fieldConfig.name}
      render={({ field }) => (
        <FormItem className="col-span-1 sm:col-span-2">
          <FormLabel>
            {fieldConfig.label}{" "}
            {fieldConfig.required && <span className="text-red-500">*</span>}
          </FormLabel>
          <FormControl>
            <ArtistSelect
              value={field.value}
              onChange={(id) => {
                field.onChange(id);
                trigger("artistId");
                if (setArtistId) setArtistId(id);
              }}
              error={isSubmitted || artistFieldTouched}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  // ─── Dimensions group (width × height sub-fields with preview) ────────────
  const renderDimensionsGroup = () => {
    return (
      <div key="dimensions-group" className="col-span-1 sm:col-span-2">
        {/* Plain <Label> — NOT <FormLabel> — because this is a group header,
            not bound to a single field. <FormLabel> requires <FormField> context. */}
        <Label className="block text-sm font-sans font-medium text-gray-700">
          Dimensions <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <FormField
            control={control}
            name="width"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-gray-500">Width (cm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="24"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      const h = watchedValues.height;
                      const w = e.target.value;
                      setValue("dimensions", w && h ? `${w}cm × ${h}cm` : "");
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-gray-500">Height (cm)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="36"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      const w = watchedValues.width;
                      const h = e.target.value;
                      setValue("dimensions", w && h ? `${w}cm × ${h}cm` : "");
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Live dimensions preview */}
        {watchedValues.width && watchedValues.height && (
          <p className="mt-2 text-sm text-gray-500">
            Preview:{" "}
            <span className="font-medium">
              {watchedValues.width}cm × {watchedValues.height}cm
            </span>
          </p>
        )}
      </div>
    );
  };

  // ─── Featured + Sold toggles group ────────────────────────────────────────
  const renderTogglesGroup = () => (
    <div key="toggles-group" className="col-span-1 sm:col-span-2 flex flex-wrap gap-6 my-2">
      {["featured", "sold"].map((name) => (
        <FormField
          key={name}
          control={control}
          name={name}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="cursor-pointer font-medium text-gray-700">
                {name === "featured" ? "Featured Artwork" : "Mark as Sold"}
              </FormLabel>
            </FormItem>
          )}
        />
      ))}
    </div>
  );

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans">
      {visibleFields.map((fieldConfig) => renderField(fieldConfig))}
    </div>
  );
}
