import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact();

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: "http://localhost:3001/trpc",
      // Remove the custom headers - let tRPC handle Content-Type
      fetch(url, options) {
        // Enhanced logging for debugging
        console.log("=== tRPC Request Debug ===");
        console.log("URL:", url);
        console.log("Method:", options?.method);
        console.log("Headers:", options?.headers);
        console.log("Body (raw):", options?.body);

        // Try to parse and log the body if it's a string
        if (options?.body && typeof options.body === "string") {
          try {
            const parsedBody = JSON.parse(options.body);
            console.log("Body (parsed):", parsedBody);
          } catch (e) {
            console.log("Body (unparseable):", options.body);
          }
        }

        return fetch(url, options)
          .then((response) => {
            console.log("Response status:", response.status);
            console.log("Response ok:", response.ok);
            return response;
          })
          .catch((error) => {
            console.error("Fetch error:", error);
            throw error;
          });
      },
    }),
  ],
});
