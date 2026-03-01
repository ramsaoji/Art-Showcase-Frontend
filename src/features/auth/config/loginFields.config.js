/**
 * @file loginFields.config.js
 * Field definitions for the Login form.
 */

/** @type {import('../types').AuthFieldConfig[]} */
export const loginFieldsConfig = [
  {
    name: "email",
    label: "Email address",
    required: true,
    type: "input",
    inputType: "email",
    placeholder: "Enter your email",
    autoFocus: true,
    autoComplete: "email",
  },
  {
    name: "password",
    label: "Password",
    required: true,
    type: "password",
    placeholder: "Enter your password",
    autoComplete: "current-password",
  },
];
