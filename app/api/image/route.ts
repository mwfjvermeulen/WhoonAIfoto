import { NextResponse } from "next/server";

const MODEL = "gemini-2.5-flash-image";

type ReqBody = {
  prompt?: string;
  image?: string | null;            // scene of laatste edit (data URL)
  productImages?: string[];         // extra afbeeldingen, bv. behang of tafels
  sceneSize?: { width: number; height: number } | null;
};

function parseDataUrl(dataUrl: string) {
  const m = /^data:(.+?);base64,(.+)$/.exec(dataUrl || "");
  if (!m) return null;
  return { mimeType: m[1], base64: m[2] };
}

export async function POST(req: Request) {
  try {
    const {
      prompt,
      image,
      productImages = [],
      sceneSize,
    }: ReqBody = await req.json();

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY ontbreekt" },
        { status: 500 }
      );
    }

    const parts: any[] = [];

    // 1. SCENE ALTIJD EERST
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

    // 2. PRODUCTEN DAARNA (MAX 2)
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

    // 3. INSTRUCTIE: SCENE LEIDEND
    const sizeHint = sceneSize
      ? `Keep the canvas exactly ${sceneSize.width}x${sceneSize.height} pixels. `
      : "";
    const baseRules =
      "Use the FIRST image as the base scene. Do not resize, crop or pad the base scene. " +
      "Only insert or overlay the following images on top of the base scene and match perspective and lighting. " +
      "Keep all existing objects, furniture, doors and windows exactly the same. " +
      "When applying patterns or wallpapers, also update cabinet compartments or shelf sections. " +
      "Do not stretch patterns. Use natural seamless repetition. " +
      "Preserve the original camera perspective and image dimensions.";

    const finalInstruction = `${prompt || ""} ${sizeHint}${baseRules}`.trim();

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
      return NextResponse.json(
        { error: json?.error?.message || "Gemini API error" },
        { status: res.status }
      );
    }

    const outParts = json?.candidates?.[0]?.content?.parts || [];
    const imgPart =
      outParts.find((p: any) => p?.inlineData?.data) ||
      outParts.find((p: any) => p?.inline_data?.data);

    const b64 =
      imgPart?.inlineData?.data || imgPart?.inline_data?.data || null;

    if (!b64) {
      console.error("No image in response:", JSON.stringify(json).slice(0, 2000));
      return NextResponse.json(
        { error: "No image returned from API" },
        { status: 502 }
      );
    }

    const dataUrl = `data:image/png;base64,${b64}`;

    return NextResponse.json(
      {
        image: dataUrl,
        description: "",
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("Route crash:", e);
    return NextResponse.json(
      { error: e.message || "Unknown error" },
      { status: 500 }
    );
  }
}
