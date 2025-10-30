"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { Input } from "./ui/input";

interface ImagePromptInputProps {
  onSubmit: (prompt: string) => void;
  isEditing: boolean;
  isLoading: boolean;
}

export function ImagePromptInput({
  onSubmit,
  isEditing,
  isLoading,
}: ImagePromptInputProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt.trim());
      setPrompt("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg">
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          {isEditing
            ? "Wil je nog wat meer veranderen?"
            : "Geef hier aan wat je wilt veranderen aan de afbeelding"}
        </p>
      </div>

      <Input
        id="prompt"
        className="border-secondary"
        placeholder={
          isEditing
            ? "Bijvoorbeeld, ik wil de klasten tegen de muur verwijdert hebben. "
            : "Bijvoorbeeld; ik wil de muren op de afbeelding groen hebben en dat er een wit tapijt ligt."
        }
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <Button
        type="submit"
        disabled={!prompt.trim() || isLoading}
        className="w-full bg-primary hover:bg-primary/90"
      >
        <Wand2 className="w-4 h-4 mr-2" />
        {isEditing ? "Genereer foto" : "Genereer foto"}
      </Button>
    </form>
  );
}
