/**
 * @file contactFields.config.js
 * Field definitions for the Contact form.
 *
 * Field types:
 *   "input"    — plain <Input>
 *   "textarea" — <Textarea>
 */

/** @type {Array} */
export const contactFieldsConfig = [
  {
    name: "name",
    label: "Name",
    required: true,
    type: "input",
    inputType: "text",
    placeholder: "Your name",
    autoFocus: true,
  },
  {
    name: "email",
    label: "Email",
    required: true,
    type: "input",
    inputType: "email",
    placeholder: "email@example.com",
  },
  {
    name: "message",
    label: "Message",
    required: true,
    type: "textarea",
    placeholder: "Your message here...",
    rows: 4,
  },
];
