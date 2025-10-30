"use client";

import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { ImagePromptInput } from "@/components/ImagePromptInput";
import { ImageResultDisplay } from "@/components/ImageResultDisplay";
import { ImageIcon, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HistoryItem } from "@/lib/types";

export default function Home() {
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [sceneSize, setSceneSize] = useState<{ width: number; height: number } | null>(null);

  const [productImage1, setProductImage1] = useState<string | null>(null);
  const [productImage2, setProductImage2] = useState<string | null>(null);

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  async function forceToSceneSize(dataUrl: string, sceneSize?: { width: number; height: number } | null) {
  if (!sceneSize) return dataUrl;
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = sceneSize.width;
      canvas.height = sceneSize.height;
      const ctx = canvas.getContext("2d")!;
      // vul canvas wit of transparant
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // teken AI-image passend in het canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = dataUrl;
  });
}


  // scène-afmetingen bepalen
  useEffect(() => {
    if (!sceneImage) {
      setSceneSize(null);
      return;
    }
    const img = new Image();
    img.onload = () => setSceneSize({ width: img.width, height: img.height });
    img.src = sceneImage;
  }, [sceneImage]);

  const handlePromptSubmit = async (prompt: string) => {
    try {
      setLoading(true);
      setError(null);

      // bewerk altijd de laatste output als die er is, anders de oorspronkelijke scène
      const imageToEdit = generatedImage || sceneImage;
      const productImages = [productImage1, productImage2].filter(Boolean) as string[];

      const response = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          image: imageToEdit,
          productImages,
          sceneSize,
          // history NIET meesturen, alleen lokaal bewaren
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini API error:", errText);
        throw new Error("Gemini API error");
      }

      const data = await response.json();

      if (data.image) {
        setGeneratedImage(data.image);
        setDescription(data.description || null);

        // history lokaal bijhouden
        const userMsg: HistoryItem = {
          role: "user",
          parts: [
            { text: prompt },
            ...(imageToEdit ? [{ image: imageToEdit }] : []),
            ...productImages.map((pi) => ({ image: pi })),
          ],
        };

        const modelMsg: HistoryItem = {
          role: "model",
          parts: [
            ...(data.description ? [{ text: data.description }] : []),
            { image: data.image },
          ],
        };

        setHistory((prev) => [...prev, userMsg, modelMsg]);
      } else {
        setError("No image returned from API");
      }
    } catch (err: any) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSceneImage(null);
    setSceneSize(null);
    setProductImage1(null);
    setProductImage2(null);
    setGeneratedImage(null);
    setDescription(null);
    setLoading(false);
    setError(null);
    setHistory([]);
  };

  const displayImage = generatedImage;

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-8">
      <Card className="w-full max-w-4xl border-0 bg-card shadow-none">
        <CardHeader className="flex flex-col items-center justify-center space-y-2">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Wand2 className="w-8 h-8 text-primary" />
            Whoon Photo Meister
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-6 w-full">
          {error && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}

          {!displayImage && !loading ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Scène-afbeelding</h3>
                  <ImageUpload onImageSelect={setSceneImage} currentImage={sceneImage} />
                  {sceneSize && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {sceneSize.width} × {sceneSize.height}px
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Product-afbeelding 1</h3>
                    <ImageUpload onImageSelect={setProductImage1} currentImage={productImage1} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Product-afbeelding 2 (optioneel)</h3>
                    <ImageUpload onImageSelect={setProductImage2} currentImage={productImage2} />
                  </div>
                </div>
              </div>

              <ImagePromptInput
                onSubmit={handlePromptSubmit}
                isEditing={!!sceneImage}
                isLoading={loading}
              />
            </>
          ) : loading ? (
            <div
              role="status"
              className="flex items-center mx-auto justify-center h-56 max-w-sm bg-gray-300 rounded-lg animate-pulse dark:bg-secondary"
            >
              <ImageIcon className="w-10 h-10 text-gray-200 dark:text-muted-foreground" />
              <span className="pl-4 font-mono font-xs text-muted-foreground">
                Processing...
              </span>
            </div>
          ) : (
            <>
              <ImageResultDisplay
                imageUrl={displayImage || ""}
                description={description}
                onReset={handleReset}
                conversationHistory={history}
              />
              <ImagePromptInput
                onSubmit={handlePromptSubmit}
                isEditing={true}
                isLoading={loading}
              />
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
