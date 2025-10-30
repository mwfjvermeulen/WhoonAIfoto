"use client";

import { useState } from "react";

interface Props {
  onSubmit: (prompt: string) => void;
  isEditing: boolean;
  isLoading: boolean;
}

export function ImagePromptInput({ onSubmit, isEditing, isLoading }: Props) {
  const [prompt, setPrompt] = useState("");

  // Deze regels moeten altijd mee
  const baseRules = [
    "Keep all existing objects, furniture, windows, doors, and decor exactly the same.",
    "When applying patterns, also update cabinet compartments and shelf sections so they match.",
    "Do not stretch patterns. Use seamless/natural repetition so proportions stay correct.",
    "Maintain the original camera perspective and image dimensions.",
  ].join(" ");

  // Hoofdonderwerp + subopties
  const presets = [
    {
      label: "Muur • Pas behang toe op volledige muur",
      text:
        "Apply the wallpaper pattern from Product Image 1 onto the wall. Use the same texture, color, and pattern, and extend or repeat it so the entire wall is covered.",
    },
    {
      label: "Muur • Pas behang toe op achterzijde muur",
      text:
        "Apply the wallpaper pattern from Product Image 1 onto the back wall only. Match lighting, colors, and perspective while keeping all other objects unchanged.",
    },
    {
      label: "Vloer • Voeg exact het tapijt toe (Product Image 1)",
      text:
        "Add the rug from Product Image 1 onto the floor, matching the perspective, lighting, and scale of the room.",
    },
    {
      label: "Vloer • Vervang tapijt met Product Image 1",
      text:
        "Replace the current rug with the rug from Product Image 1, ensuring lighting, shadows, and scale remain realistic.",
    },
    {
      label: "Vloer • Verander de vloerkleur",
      text:
        "Change the floor color to the specified color, keeping material, texture, reflections and lighting identical.",
    },
    {
      label: "Vloer • Pas visgraatvloer toe",
      text:
        "Replace the current floor with a natural wood herringbone pattern. Keep lighting and reflections realistic and preserve the room’s dimensions and perspective.",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPrompt = prompt.trim();
    if (!finalPrompt) return;
    // baseRules altijd meesturen
    onSubmit(`${finalPrompt}\n\n${baseRules}`);
  };

  const handlePresetClick = (text: string) => {
    // bij klikken meteen de volledige prompt invullen inclusief vaste regels
    const full = `${text}\n\n${baseRules}`;
    setPrompt(full);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => handlePresetClick(p.text)}
            className="text-xs border px-2 py-1 rounded-md hover:bg-accent"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div>
        <textarea
          id="prompt"
          className="w-full min-h-[110px] p-3 border rounded-md text-sm"
          placeholder={
            isEditing
              ? "Beschrijf wat je wilt wijzigen in de afbeelding."
              : "Bijvoorbeeld: pas behang toe op de achterwand."
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

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
