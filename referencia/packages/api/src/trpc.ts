// packages/api/src/trpc.ts
// Clinic-OS tRPC Core with Multi-Tenant Enforcement

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { prisma, createTenantClient, TenantPrismaClient } from "@clinic-os/db";

export interface CreateContextOptions {
  workspaceId?: string;
  userId?: string;
  userRole?: string;
}

export async function createTRPCContext(opts: { req?: Request; headers?: Headers; session?: any }) {
  // Extract tenant workspaceId from session
  if (!opts.session || !opts.session.user) {
    return {
      workspaceId: null,
      userId: null,
      userRole: null,
      prisma,
    };
  }

  const user = opts.session.user;

  return {
    workspaceId: user.workspaceId,
    userId: user.id,
    userRole: user.role,
    prisma,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Tenant-isolated procedure.
 * Guarantees that every database access is strictly scoped to the workspaceId.
 */
export const tenantProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.workspaceId || !ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "SECURITY EXCEPTION: Missing tenant workspace identifier or active session. Multi-tenant isolation violation.",
    });
  }

  // Create scoped tenant DB client (with RLS support via extension)
  const tenantDb: TenantPrismaClient = createTenantClient(ctx.workspaceId, ctx.userId, ctx.userRole || 'DOCTOR');

  return next({
    ctx: {
      ...ctx,
      workspaceId: ctx.workspaceId,
      db: tenantDb,
    },
  });
});
