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
 * PurchaseRequestFields
 * Config-driven field renderer for the Purchase Request form.
 * Maps over purchaseRequestFieldsConfig and renders the appropriate shadcn field.
 *
 * Supported field types:
 *   "input"    — plain <Input>
 *   "textarea" — <Textarea>
 *
 * @param {object} props
 * @param {Array} props.config - Array of field config objects (purchaseRequestFieldsConfig).
 */
export default function PurchaseRequestFields({ config }) {
  const { control } = useFormContext();

  return (
    <>
      {config.map((fieldConfig) => {
        const { name, label, required, type, inputType, placeholder, autoFocus, inputProps, rows } = fieldConfig;

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
                      rows={rows || 3}
                      className="resize-none"
                      {...field}
                    />
                  ) : (
                    <Input
                      type={inputType || "text"}
                      placeholder={placeholder}
                      autoFocus={autoFocus}
                      {...(inputProps || {})}
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
