import React, { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

/**
 * AuthFormFields
 * Config-driven field renderer for all auth forms (Signup, Login, ChangePassword).
 * Maps over the provided field config and renders the appropriate shadcn FormField.
 *
 * Supported field types:
 *   "input"    — plain <Input> with configurable inputType, placeholder, autoComplete, etc.
 *   "password" — <Input type="password/text"> with an eye-toggle button.
 *                Password visibility state is managed internally, keyed by field name,
 *                so any number of password fields work without prop-drilling.
 *
 * @param {object} props
 * @param {Array} props.config - Array of field config objects (e.g. signupFieldsConfig).
 */
export default function AuthFormFields({ config }) {
  const { control } = useFormContext();

  // ── Password visibility: one boolean per password field, keyed by field name ──
  const [visibility, setVisibility] = useState(() =>
    Object.fromEntries(
      config.filter((f) => f.type === "password").map((f) => [f.name, false])
    )
  );

  const toggleVisibility = useCallback(
    (name) => setVisibility((prev) => ({ ...prev, [name]: !prev[name] })),
    []
  );

  return (
    <>
      {config.map((fieldConfig) => {
        const { name, label, required, type, inputType, placeholder, autoFocus, autoComplete, inputProps } = fieldConfig;

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
                  {type === "password" ? (
                    // ── Password input with eye-toggle ──────────────────────
                    <div className="relative">
                      <Input
                        type={visibility[name] ? "text" : "password"}
                        placeholder={placeholder}
                        className="pr-10"
                        autoFocus={autoFocus}
                        autoComplete={autoComplete}
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => toggleVisibility(name)}
                        aria-label={visibility[name] ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500 transition-colors"
                      >
                        {visibility[name] ? (
                          <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <EyeIcon className="h-5 w-5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  ) : (
                    // ── Standard input ───────────────────────────────────────
                    <Input
                      type={inputType || "text"}
                      placeholder={placeholder}
                      autoFocus={autoFocus}
                      autoComplete={autoComplete}
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
