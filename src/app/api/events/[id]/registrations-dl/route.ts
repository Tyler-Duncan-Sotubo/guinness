// app/api/events/[eventId]/registrations/export-to-s3/route.ts

import { registrationListByEvent } from "@/server/registrations";
import { exportToCSVBuffer, exportToExcelBuffer } from "@/lib/export-util";
import { uploadBufferToS3, guessMimeType } from "@/lib/s3-storage";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { format = "csv" } = await req.json().catch(() => ({}));

  const result = await registrationListByEvent(id);

  if (!result.ok) {
    return new Response(result.error ?? "Not found", { status: 404 });
  }

  const items = result.items;
  if (!items.length) {
    return new Response("No registrations for this event", { status: 404 });
  }

  const columns = [
    { field: "name", title: "Name" },
    { field: "email", title: "Email" },
    { field: "phone", title: "Phone" },
    { field: "registrationId", title: "Registration ID" },
    { field: "createdAt", title: "Created At" },
    { field: "status", title: "Status" },
    { field: "source", title: "Source" },
    { field: "attendeeId", title: "Attendee ID" },
  ];

  const rows = items.map((r) => ({
    ...r,
    phone: r.phone ? String(r.phone) : "",
    createdAt: r.createdAt ? r.createdAt.toISOString() : "",
  }));

  const safeEventId = id.replace(/[^a-zA-Z0-9_-]/g, "");
  const ext = format === "excel" || format === "xlsx" ? "xlsx" : "csv";
  const filename = `registrations_${safeEventId}.${ext}`;
  const key = `exports/events/${safeEventId}/${filename}`;

  const buffer =
    ext === "xlsx"
      ? await exportToExcelBuffer(rows, columns, "Registrations")
      : exportToCSVBuffer(rows, columns);

  const mimeType = guessMimeType(filename);

  const { url } = await uploadBufferToS3(buffer, key, mimeType);

  return Response.json({ ok: true, url, key });
}
