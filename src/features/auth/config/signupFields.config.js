/**
 * @file signupFields.config.js
 * Field definitions for the Signup form.
 * The renderer (AuthFormFields) maps over this to produce the correct shadcn fields.
 *
 * Field types:
 *   "input"    — plain <Input> with an inputType ("text", "email", etc.)
 *   "password" — <Input> wrapped with an eye-toggle button (visibility managed internally)
 */

/** @type {import('../types').AuthFieldConfig[]} */
export const signupFieldsConfig = [
  {
    name: "artistName",
    label: "Artist Name",
    required: true,
    type: "input",
    inputType: "text",
    placeholder: "Enter your artist name",
    autoFocus: true,
  },
  {
    name: "email",
    label: "Email",
    required: true,
    type: "input",
    inputType: "email",
    placeholder: "Enter your email",
  },
  {
    name: "password",
    label: "Password",
    required: true,
    type: "password",
    placeholder: "Create a password (min. 8 characters)",
  },
  {
    name: "confirmPassword",
    label: "Confirm Password",
    required: true,
    type: "password",
    placeholder: "Confirm your password",
  },
];
