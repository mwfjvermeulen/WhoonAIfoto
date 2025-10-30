import { NextResponse } from "next/server";

const MODEL = "gemini-2.5-flash-image";

type ReqBody = {
  prompt?: string;
  image?: string | null;             // scene (data URL)
  productImages?: string[];          // extra uploads als data URLs
  productUrls?: string[];            // product-URLs (png/jpg)
  sceneSize?: { width: number; height: number } | null;
};

function parseDataUrl(dataUrl: string) {
  const m = /^data:(.+?);base64,(.+)$/.exec(dataUrl || "");
  if (!m) return null;
  return { mimeType: m[1], base64: m[2] };
}

async function fetchAsBase64(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Fetch failed ${r.status} for ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  return buf.toString("base64");
}

export async function POST(req: Request) {
  try {
    const { prompt, image, productImages = [], productUrls = [], sceneSize }: ReqBody = await req.json();

    const key = process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({ error: "GEMINI_API_KEY ontbreekt" }, { status: 500 });

    const parts: any[] = [];

    // 1) Scene eerst, leidend
    if (image) {
      const parsed = parseDataUrl(image);
      if (parsed) {
        parts.push({ inlineData: { mimeType: parsed.mimeType, data: parsed.base64 } });
      }
    }

    // 2) Product uploads (0..2)
    for (const p of productImages.slice(0, 2)) {
      const parsed = parseDataUrl(p);
      if (parsed) {
        parts.push({ inlineData: { mimeType: parsed.mimeType, data: parsed.base64 } });
      }
    }

    // 3) Product URLs (0..2)
    for (const url of productUrls.slice(0, 2)) {
      const b64 = await fetchAsBase64(url);
      const mime = url.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
      parts.push({ inlineData: { mimeType: mime, data: b64 } });
    }

    // 4) Instructie: scène bepaalt canvas. Geen resizes.
    const sizeText = sceneSize ? `Houd het canvas exact ${sceneSize.width}x${sceneSize.height} pixels. ` : "";
    const instruction =
      (prompt?.trim() ? prompt.trim() + " " : "") +
      "Gebruik de eerste afbeelding als basis-canvas. Pas GEEN resize, crop of padding toe. " +
      sizeText +
      "Gebruik de volgende afbeeldingen uitsluitend als in te voegen producten. " +
      "Plaats ze op het vloerkleed, match perspectief en schaal met de kamer, voeg een realistische slagschaduw, " +
      "en verander verder niets in de scene.";

    parts.push({ text: instruction });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts }] }),
      }
    );

    const json = await res.json();
    if (!res.ok) {
      console.error("Gemini error:", res.status, json);
      return NextResponse.json({ error: json?.error?.message || "Gemini API error" }, { status: res.status });
    }

    const outParts = json?.candidates?.[0]?.content?.parts || [];
    const imgPart =
      outParts.find((p: any) => p?.inlineData?.data) ||
      outParts.find((p: any) => p?.inline_data?.data);
    const b64 = imgPart?.inlineData?.data || imgPart?.inline_data?.data;

    if (!b64) {
      console.error("No image in response:", JSON.stringify(json).slice(0, 2000));
      return NextResponse.json({ error: "No image returned from API" }, { status: 502 });
    }

    const dataUrl = `data:image/png;base64,${b64}`;
    return NextResponse.json({ image: dataUrl, description: "" }, { status: 200 });
  } catch (e: any) {
    console.error("Route crash:", e);
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
