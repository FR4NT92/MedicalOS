// apps/web/lib/trpc/client.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@clinic-os/api";

export const trpc = createTRPCReact<AppRouter>();
