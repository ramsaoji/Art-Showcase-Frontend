/**
 * Public barrel for the contact feature module.
 * Consumers import via:
 *   import { ContactFormFields, contactFieldsConfig, contactSchema } from "@/features/contact";
 */
export { default as ContactFormFields } from "./components/ContactFormFields";
export { contactFieldsConfig } from "./config/contactFields.config";
export { contactSchema } from "./schema/contactValidation";
