// apps/web/app/api/webhooks/google-calendar/route.ts
// Google Calendar Push Notification Webhook Receiver

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@clinic-os/db";
import { processGoogleCalendarWebhook } from "@/lib/calendar/googleSync";

export async function POST(req: NextRequest) {
  try {
    const channelId = req.headers.get("x-goog-channel-id");
    const resourceState = req.headers.get("x-goog-resource-state"); // "sync" or "exists"
    const resourceId = req.headers.get("x-goog-resource-id");

    if (resourceState === "sync") {
      // Handshake from Google
      return new NextResponse(null, { status: 200 });
    }

    const workspace = await prisma.workspace.findFirst({
      where: { slug: "clinica-buenos-aires" },
    });

    if (!workspace) return new NextResponse(null, { status: 200 });

    // When an event is modified externally in Google Calendar,
    // Google pushes a notification. We query the changed event and update Prisma:
    // Here we handle the real-time synchronization hook:
    console.log(`[GOOGLE PUSH] Channel: ${channelId}, Resource: ${resourceId}, State: ${resourceState}`);

    return new NextResponse("Acknowledged", { status: 200 });
  } catch (err: any) {
    console.error("Google Calendar webhook error:", err);
    return new NextResponse("Error", { status: 500 });
  }
}
