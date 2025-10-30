import { NextResponse } from "next/server";

const MODEL = "gemini-2.5-flash-image";

type ReqBody = {
  prompt?: string;
  image?: string | null; // scène of laatste gegenereerde image
  productImages?: string[]; // 0..2 extra afbeeldingen (behang, tapijt, product)
  sceneSize?: { width: number; height: number } | null; // door frontend meegestuurd
};

function parseDataUrl(dataUrl: string) {
  const match = /^data:(.+?);base64,(.+)$/.exec(dataUrl || "");
  if (!match) return null;
  return {
    mimeType: match[1],
    base64: match[2],
  };
}

export async function POST(req: Request) {
  try {
    const { prompt, image, productImages = [], sceneSize }: ReqBody = await req.json();

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY ontbreekt in de environment" },
        { status: 500 }
      );
    }

    const parts: any[] = [];

    // 1. SCÈNE ALTIJD EERST
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

    // 2. PRODUCTEN (MAX 2) PAS DAARNA
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

    // 3. INSTRUCTIE: EERSTE = CANVAS
    const sizeRule = sceneSize
      ? `Keep the canvas exactly ${sceneSize.width}x${sceneSize.height} pixels. `
      : "";

    // prompt die jij vanuit de UI krijgt
    const userPrompt = prompt?.trim() ? prompt.trim() + " " : "";

    const finalInstruction =
      userPrompt +
      "Use the FIRST image as the base scene. " +
      "Do not resize, crop or pad the base scene. " +
      "Only insert or overlay the following images on top of the base scene. " +
      "Keep all existing furniture, objects, decor, windows and doors exactly the same. " +
      "When applying wallpaper or floor changes, also update cabinet compartments and shelf sections so they match. " +
      "Do not stretch patterns. Use natural/seamless repetition so proportions stay correct. " +
      "Maintain the original camera perspective and composition. " +
      sizeRule;

    parts.push({ text: finalInstruction });

    // 4. CALL GEMINI
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts,
            },
          ],
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

    // 5. IMAGE UIT RESPONSE PAKKEN
    const outParts = json?.candidates?.[0]?.content?.parts || [];
    const imgPart =
      outParts.find((p: any) => p?.inlineData?.data) ||
      outParts.find((p: any) => p?.inline_data?.data);

    const b64 =
      imgPart?.inlineData?.data || imgPart?.inline_data?.data || null;

    if (!b64) {
      console.error("No image in Gemini response:", JSON.stringify(json).slice(0, 1500));
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
  } catch (err: any) {
    console.error("Route crash:", err);
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
