/**
 * @file artworkFields.config.js
 * Config-driven field definitions for the artwork form.
 *
 * Each entry describes one form field. The renderer (ArtworkFormFields.jsx)
 * maps over this array to produce the correct shadcn <FormField> for each item.
 *
 * Supported `type` values:
 *   "input"          — shadcn <Input>
 *   "textarea"       — shadcn <Textarea>
 *   "select"         — shadcn <Select> with options from `selectOptions`
 *   "switch"         — shadcn <Switch> for boolean toggles
 *   "datetime-local" — shadcn DateTimePicker (<Calendar> inside <Popover>) + time inputs
 *   "artist-select"  — custom <ArtistSelect> component (injected via prop)
 *
 * `adminOnly: true`   → field is hidden from non-admin users.
 * `createOnly: true`  → field is hidden in edit mode (initialData present).
 * `colSpan: 1 | 2`   → grid column span (out of 2-column grid).
 */

/** @type {import('../types').ArtworkFieldConfig[]} */
export const artworkFieldsConfig = [
  // ─── Artist Selection (admin, create mode only) ───────────────────────────
  {
    name: "artistId",
    label: "Select Artist",
    required: true,
    type: "artist-select",
    colSpan: 2,
    adminOnly: true,
    createOnly: true,
  },

  // ─── Core Details ─────────────────────────────────────────────────────────
  {
    name: "title",
    label: "Title",
    required: true,
    type: "input",
    inputType: "text",
    placeholder: "Enter the artwork title",
    colSpan: 2,
  },
  {
    name: "price",
    label: "Price (INR)",
    required: true,
    type: "input",
    inputType: "number",
    placeholder: "Enter price in INR",
    inputProps: { min: "0", step: "1" },
    colSpan: 2,
  },

  // ─── Description (with AI button — handled specially in renderer) ──────────
  {
    name: "description",
    label: "Description",
    required: true,
    type: "textarea",
    placeholder: "Describe the artwork, its inspiration, and any unique features or generate with AI",
    rows: 5,
    colSpan: 2,
    hasAIButton: true, // Renderer renders the AI button row below this field
  },

  // ─── Dimensions (special: two sub-inputs — handled as a group in renderer) ─
  {
    name: "dimensions-group",
    type: "dimensions-group", // Renderer renders the full w×h group block
    colSpan: 2,
  },

  // ─── Material & Style ─────────────────────────────────────────────────────
  {
    name: "material",
    label: "Material",
    required: true,
    type: "select",
    placeholder: "Select material",
    colSpan: 1,
    selectOptions: [
      "Oil on Canvas",
      "Acrylic on Canvas",
      "Watercolor on Paper",
      "Mixed Media",
      "Digital Art",
      "Sculpture",
      "Photography",
      "Printmaking",
      "Collage",
      "Drawing",
      "Other",
    ],
  },
  {
    name: "style",
    label: "Style",
    required: true,
    type: "select",
    placeholder: "Select style",
    colSpan: 1,
    selectOptions: [
      "Abstract",
      "Realistic",
      "Impressionist",
      "Expressionist",
      "Surrealist",
      "Contemporary",
      "Traditional",
      "Modern",
      "Landscape",
      "Portrait",
      "Still Life",
      "Other",
    ],
  },

  // ─── Optional Links ───────────────────────────────────────────────────────
  {
    name: "instagramReelLink",
    label: "Instagram Reel Link",
    required: false,
    type: "input",
    inputType: "url",
    placeholder: "https://www.instagram.com/reel/...",
    colSpan: 1,
  },
  {
    name: "youtubeVideoLink",
    label: "YouTube Video Link",
    required: false,
    type: "input",
    inputType: "url",
    placeholder: "https://www.youtube.com/watch?...",
    colSpan: 1,
  },

  // ─── Year ─────────────────────────────────────────────────────────────────
  {
    name: "year",
    label: "Year",
    required: true,
    type: "input",
    inputType: "number",
    placeholder: String(new Date().getFullYear()),
    inputProps: { min: "1800", max: String(new Date().getFullYear()) },
    colSpan: 1,
  },

  // ─── Admin-only: Status & Expiry ──────────────────────────────────────────
  {
    name: "status",
    label: "Status",
    required: false,
    type: "select",
    placeholder: "Status",
    colSpan: 1,
    adminOnly: true,
    selectOptions: ["ACTIVE", "INACTIVE", "EXPIRED"],
    selectLabels: { ACTIVE: "Active", INACTIVE: "Inactive", EXPIRED: "Expired" },
    // Special: ACTIVE and INACTIVE are disabled when expiresAt is in the past.
    // The renderer handles this conditional disabling via watchedValues.
    hasExpiryConditional: true,
  },
  {
    name: "expiresAt",
    label: "Expires At",
    required: false,
    type: "datetime-local",
    colSpan: 1,
    adminOnly: true,
  },

  // ─── Admin-only: Toggles ──────────────────────────────────────────────────
  {
    name: "toggles-group",
    type: "toggles-group", // Renderer renders the Featured + Sold checkbox row
    colSpan: 2,
    adminOnly: true,
  },
];
