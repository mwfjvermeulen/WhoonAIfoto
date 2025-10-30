"use client";

import { useState } from "react";

interface Props {
  onSubmit: (prompt: string) => void;
  isEditing: boolean;
  isLoading: boolean;
}

export function ImagePromptInput({ onSubmit, isEditing, isLoading }: Props) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) onSubmit(prompt.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <textarea
        id="prompt"
        className="w-full min-h-[110px] p-3 border rounded-md text-sm"
        placeholder={
          isEditing
            ? "Beschrijf wat je wilt aanpassen in de afbeelding..."
            : "Bijvoorbeeld: ik wil de muren op de afbeelding groen hebben en het vloerkleed donkerder maken."
        }
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground disabled:opacity-50"
      >
        {isLoading ? "Verwerken..." : "Uitvoeren"}
      </button>
    </form>
  );
}
