import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border-0 px-2.5 py-1.5 text-xs font-semibold font-sans align-middle transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-indigo-100 text-indigo-700",
        secondary:
          "bg-gray-100 text-gray-700",
        destructive:
          "bg-red-100 text-red-700",
        success:
          "bg-green-100 text-green-700",
        warning:
          "bg-yellow-100 text-yellow-700",
        outline:
          "border border-gray-200 text-gray-700 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }
