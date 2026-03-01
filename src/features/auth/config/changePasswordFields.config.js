/**
 * @file changePasswordFields.config.js
 * Field definitions for the Change Password form.
 */

/** @type {import('../types').AuthFieldConfig[]} */
export const changePasswordFieldsConfig = [
  {
    name: "currentPassword",
    label: "Current Password",
    required: true,
    type: "password",
    placeholder: "Enter your current password",
    autoFocus: true,
  },
  {
    name: "newPassword",
    label: "New Password",
    required: true,
    type: "password",
    placeholder: "Enter new password (min. 8 chars)",
  },
  {
    name: "confirmNewPassword",
    label: "Confirm New Password",
    required: true,
    type: "password",
    placeholder: "Confirm your new password",
  },
];
