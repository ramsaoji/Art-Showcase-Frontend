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
    }),
  ],
});
