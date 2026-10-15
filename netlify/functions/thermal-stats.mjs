import { getReports, summarizeReports } from "../lib/thermal-data.mjs";

export default async function handler(request) {
  if (request.method !== "GET") {
    return Response.json({ error: "Metode tidak diizinkan." }, { status: 405 });
  }

  try {
    const reports = await getReports();
    return Response.json(summarizeReports(reports), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("ThermaFair dashboard read failed:", error);
    return Response.json(
      { error: "Data dasbor tidak dapat dibaca." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
