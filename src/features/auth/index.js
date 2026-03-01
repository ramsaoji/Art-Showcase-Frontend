/**
 * Public barrel for the auth feature module.
 * Consumers import via:
 *   import { AuthFormFields, loginFieldsConfig, ... } from "@/features/auth";
 */
export { default as AuthFormFields } from "./components/AuthFormFields";
export { loginFieldsConfig } from "./config/loginFields.config";
export { signupFieldsConfig } from "./config/signupFields.config";
export { changePasswordFieldsConfig } from "./config/changePasswordFields.config";
export { loginSchema, signupSchema, changePasswordSchema } from "./schema/authValidation";
