import { httpLink } from "@trpc/client"; // Changed from httpBatchLink
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

export const trpc = createTRPCReact();

export const trpcClient = trpc.createClient({
  transformer: superjson,
  links: [
    httpLink({
      // Changed from httpBatchLink
      url: "http://localhost:3001/trpc",
      // Add fetch implementation with error handling
      fetch(url, options) {
        return fetch(url, options).catch((err) => {
          console.error("tRPC fetch error:", err);
          // Return a resolved promise with a response-like object to prevent app from crashing
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () =>
              Promise.resolve({
                error: { message: "Failed to connect to tRPC server" },
              }),
          });
        });
      },
    }),
  ],
});
