const json = (body, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

export default async function handler(request) {
  if (request.method !== "POST") {
    return json({ error: "Metode tidak diizinkan." }, 405);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json(
      { error: "GEMINI_API_KEY belum diatur di environment variables Netlify." },
      503,
    );
  }

  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 48_000) {
      return json({ error: "Permintaan AI terlalu besar." }, 413);
    }

    const payload = JSON.parse(rawBody);
    if (!Array.isArray(payload.contents) || payload.contents.length === 0) {
      return json({ error: "Format permintaan AI tidak valid." }, 400);
    }

    const requestedTokens = Number(payload.generationConfig?.maxOutputTokens);
    payload.generationConfig = {
      ...(payload.generationConfig || {}),
      maxOutputTokens: Number.isFinite(requestedTokens)
        ? Math.max(1, Math.min(Math.floor(requestedTokens), 512))
        : 512,
    };

    const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await upstream.text();
    return new Response(responseBody, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("ThermaFair Gemini request failed:", error);
    return json({ error: "Gemini tidak dapat dihubungi. Silakan coba lagi." }, 502);
  }
}
