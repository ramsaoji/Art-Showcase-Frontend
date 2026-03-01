import { Toaster as Sonner } from "sonner"

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="light"
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "font-sans text-sm rounded-xl border border-gray-200 bg-white text-gray-900 shadow-lg px-4 py-3",
          title: "font-semibold text-gray-900 text-sm",
          description: "text-gray-500 text-xs mt-0.5",
          success:
            "border-green-200 bg-green-50 text-green-900 [&>[data-icon]]:text-green-600",
          error:
            "border-red-200 bg-red-50 text-red-900 [&>[data-icon]]:text-red-600",
          warning:
            "border-yellow-200 bg-yellow-50 text-yellow-900 [&>[data-icon]]:text-yellow-600",
          info:
            "border-indigo-200 bg-indigo-50 text-indigo-900 [&>[data-icon]]:text-indigo-600",
          actionButton:
            "bg-indigo-600 text-white text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-indigo-700 transition-colors",
          cancelButton:
            "bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-gray-200 transition-colors",
          closeButton:
            "text-gray-400 hover:text-gray-600 transition-colors",
        },
      }}
      {...props}
    />
  );
}

export { Toaster }
