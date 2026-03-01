import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * ContactFormFields
 * Config-driven field renderer for the Contact form.
 * Maps over contactFieldsConfig and renders the appropriate shadcn field.
 *
 * Supported field types:
 *   "input"    — plain <Input>
 *   "textarea" — <Textarea>
 *
 * @param {object} props
 * @param {Array} props.config - Array of field config objects (contactFieldsConfig).
 * @param {boolean} props.isSubmitting - Disables all fields during submission.
 */
export default function ContactFormFields({ config, isSubmitting }) {
  const { control } = useFormContext();

  return (
    <>
      {config.map((fieldConfig) => {
        const { name, label, required, type, inputType, placeholder, autoFocus, rows } = fieldConfig;

        return (
          <FormField
            key={name}
            control={control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {label}
                  {required && <span className="text-red-500 ml-1">*</span>}
                </FormLabel>
                <FormControl>
                  {type === "textarea" ? (
                    <Textarea
                      placeholder={placeholder}
                      rows={rows || 4}
                      className="resize-none"
                      disabled={isSubmitting}
                      {...field}
                    />
                  ) : (
                    <Input
                      type={inputType || "text"}
                      placeholder={placeholder}
                      autoFocus={autoFocus}
                      disabled={isSubmitting}
                      {...field}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      })}
    </>
  );
}
