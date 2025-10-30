"use client";

import { useState } from "react";

interface Props {
  onSubmit: (prompt: string) => void;
  isEditing: boolean;
  isLoading: boolean;
}

export function ImagePromptInput({ onSubmit, isEditing, isLoading }: Props) {
  const [prompt, setPrompt] = useState("");

  // Standaard prompt-opties
  const presets = [
    {
      label: "Pas behang toe",
      text: `Apply the wallpaper pattern from Product Image 1 onto the wall. Use the same texture, color, and pattern, and extend or repeat it so the entire wall is covered. Keep all other objects, lighting, and proportions exactly the same. Maintain the original perspective and image dimensions.`,
    },
    {
      label: "Wijzig vloerkleed",
      text: `Replace the current rug with the pattern and color from Product Image 1. Match lighting and shadows naturally. Keep all other elements identical and preserve the original camera perspective and dimensions.`,
    },
    {
      label: "Verander tafeldecoratie",
      text: `Replace the table decoration with the items shown in Product Image 2, keeping the lighting, color tone, and perspective consistent.`,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) onSubmit(prompt.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      {/* Suggestieknoppen */}
      <div className="flex flex-wrap gap-2 mb-2">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setPrompt(p.text)}
            className="text-xs border px-2 py-1 rounded-md hover:bg-accent"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div>
        <textarea
          id="prompt"
          className="w-full min-h-[100px] p-3 border rounded-md text-sm"
          placeholder={
            isEditing
              ? "Beschrijf wat je wilt wijzigen in de afbeelding..."
              : "Bijvoorbeeld: ik wil de muren op de afbeelding groen hebben..."
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {isLoading ? "Verwerken..." : "Uitvoeren"}
      </button>
    </form>
  );
}
