import { getReports, reportsToCsv } from "../lib/thermal-data.mjs";

export default async function handler(request) {
  if (request.method !== "GET") {
    return new Response("Metode tidak diizinkan.", { status: 405 });
  }

  try {
    const csv = reportsToCsv(await getReports());
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="thermafair-laporan.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("ThermaFair CSV export failed:", error);
    return Response.json(
      { error: "CSV tidak dapat dibuat." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
