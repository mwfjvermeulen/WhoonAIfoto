import { NextResponse } from "next/server";

const MODEL = "gemini-2.5-flash-image";

type ReqBody = {
  prompt?: string;
  image?: string | null;            // huidige scène of laatst gegenereerde
  productImages?: string[];         // max 2
  sceneSize?: { width: number; height: number } | null;
};

function parseDataUrl(dataUrl: string) {
  const m = /^data:(.+?);base64,(.+)$/.exec(dataUrl || "");
  if (!m) return null;
  return { mimeType: m[1], base64: m[2] };
}

export async function POST(req: Request) {
  try {
    const { prompt, image, productImages = [], sceneSize }: ReqBody = await req.json();

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "GEMINI_API_KEY ontbreekt" }, { status: 500 });
    }

    // we sturen max 1 scene + max 2 producten
    const parts: any[] = [];

    // 1. scene (verplicht)
    if (image) {
      const parsed = parseDataUrl(image);
      if (parsed) {
        parts.push({
          inlineData: {
            mimeType: parsed.mimeType,
            data: parsed.base64,
          },
        });
      }
    }

    // 2. producten (optioneel, max 2, en alleen als ze echt bestaan)
    const cleanProducts = productImages.filter(Boolean).slice(0, 2);
    for (const p of cleanProducts) {
      const parsed = parseDataUrl(p);
      if (parsed) {
        parts.push({
          inlineData: {
            mimeType: parsed.mimeType,
            data: parsed.base64,
          },
        });
      }
    }

    // 3. instructie altijd onderaan
    const sizeText = sceneSize ? `Keep the canvas exactly ${sceneSize.width}x${sceneSize.height} pixels. ` : "";
    const baseRules =
      "Keep all existing objects, furniture and decor exactly the same. " +
      "When applying wallpaper or floor changes, also update cabinet compartments and shelf sections. " +
      "Do not stretch patterns, use natural repetition. " +
      "Maintain original camera perspective and image dimensions.";

    const finalInstruction = `${prompt || ""} ${sizeText}${baseRules}`.trim();

    parts.push({ text: finalInstruction });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
        }),
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
      return NextResponse.json({ error: "No image returned from API" }, { status: 502 });
    }

    const dataUrl = `data:image/png;base64,${b64}`;
    return NextResponse.json({ image: dataUrl, description: "" }, { status: 200 });
  } catch (e: any) {
    console.error("Route crash:", e);
    return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
  }
}
