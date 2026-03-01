/**
 * @file purchaseRequestFields.config.js
 * Field definitions for the Purchase Request form.
 *
 * Field types:
 *   "input"    — plain <Input>
 *   "textarea" — <Textarea>
 */

/** @type {import('../types').PurchaseRequestFieldConfig[]} */
export const purchaseRequestFieldsConfig = [
  {
    name: "name",
    label: "Name",
    required: true,
    type: "input",
    inputType: "text",
    placeholder: "Your full name",
    autoFocus: true,
  },
  {
    name: "email",
    label: "Email",
    required: true,
    type: "input",
    inputType: "email",
    placeholder: "you@email.com",
  },
  {
    name: "phone",
    label: "Phone",
    required: true,
    type: "input",
    inputType: "tel",
    placeholder: "e.g. 9876543210",
    inputProps: { maxLength: 10 },
  },
  {
    name: "address",
    label: "Address",
    required: true,
    type: "textarea",
    placeholder: "Your address",
    rows: 3,
  },
];
