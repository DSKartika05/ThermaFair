import { getStore } from "@netlify/blobs";

const allowed = {
  gender: new Set(["perempuan", "laki-laki", "lainnya"]),
  ageGroup: new Set(["18-29", "30-39", "40-49", "50+"]),
  clothing: new Set([
    "formal-tebal",
    "formal-tipis",
    "kasual",
    "gamis-hijab",
    "jaket-tambahan",
  ]),
  location: new Set(["dekat-ac", "tengah", "jauh-ac", "pinggir-jendela"]),
  condition: new Set([
    "sangat-dingin",
    "dingin",
    "nyaman",
    "panas",
    "sangat-panas",
  ]),
  zone: new Set(["Cold Spot", "Zona Nyaman", "Hot Spot"]),
};

const json = (body, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

export default async function handler(request) {
  if (request.method !== "POST") {
    return json({ error: "Metode tidak diizinkan." }, 405);
  }

  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 8_192) {
      return json({ error: "Ukuran laporan terlalu besar." }, 413);
    }

    const input = JSON.parse(rawBody);
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return json({ error: "Format laporan tidak valid." }, 400);
    }
    for (const field of ["gender", "ageGroup", "clothing", "location", "condition", "zone"]) {
      if (!allowed[field].has(input[field])) {
        return json({ error: `Nilai ${field} tidak valid.` }, 400);
      }
    }

    const currentTemp = Number(input.currentTemp);
    const score = Number(input.score);
    if (!Number.isFinite(currentTemp) || currentTemp < 16 || currentTemp > 32) {
      return json({ error: "Suhu harus berada di antara 16–32°C." }, 400);
    }
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      return json({ error: "Skor laporan tidak valid." }, 400);
    }

    const report = {
      createdAt: new Date().toISOString(),
      gender: input.gender,
      ageGroup: input.ageGroup,
      clothing: input.clothing,
      location: input.location,
      currentTemp,
      condition: input.condition,
      score,
      zone: input.zone,
    };

    const store = getStore("thermafair-reports");
    await store.setJSON(`report/${crypto.randomUUID()}`, report);
    return json({ ok: true }, 201);
  } catch (error) {
    console.error("ThermaFair report submission failed:", error);
    return json({ error: "Laporan tidak dapat disimpan. Silakan coba lagi." }, 500);
  }
}
