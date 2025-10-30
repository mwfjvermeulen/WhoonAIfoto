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

  const [productUrl1, setProductUrl1] = useState<string>("");
  const [productUrl2, setProductUrl2] = useState<string>("");

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (!sceneImage) { setSceneSize(null); return; }
    const img = new Image();
    img.onload = () => setSceneSize({ width: img.width, height: img.height });
    img.src = sceneImage;
  }, [sceneImage]);

  const handlePromptSubmit = async (prompt: string) => {
    try {
      setLoading(true);
      setError(null);

      const imageToEdit = generatedImage || sceneImage;
      const productImages = [productImage1, productImage2].filter(Boolean) as string[];
      const productUrls = [productUrl1.trim(), productUrl2.trim()].filter(Boolean);

      const response = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          image: imageToEdit,
          productImages,
          productUrls,
          sceneSize,
          history: history.length > 0 ? history : undefined,
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
    setProductUrl1("");
    setProductUrl2("");
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
            Producten toevoegen op een scène, scène-grootte leidend
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
                  <h3 className="text-sm font-semibold mb-2">Scene-afbeelding</h3>
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
                    <h3 className="text-sm font-semibold mb-2">Product-afbeelding 2</h3>
                    <ImageUpload onImageSelect={setProductImage2} currentImage={productImage2} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold">Product URL 1</label>
                  <input
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
                    placeholder="https://...png of .jpg"
                    value={productUrl1}
                    onChange={(e) => setProductUrl1(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Product URL 2</label>
                  <input
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
                    placeholder="https://...png of .jpg"
                    value={productUrl2}
                    onChange={(e) => setProductUrl2(e.target.value)}
                  />
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
