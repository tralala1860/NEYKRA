export type Theme = "shonen" | "seinen" | "kawaii";
export type ColorMode = "dark" | "light";

export const THEMES: { value: Theme; label: string; description: string }[] = [
  {
    value: "shonen",
    label: "Shonen",
    description: "Énergique et vives — style Naruto / One Piece",
  },
  {
    value: "seinen",
    label: "Seinen",
    description: "Sombre et dramatique — style Tokyo Ghoul / AOT",
  },
  {
    value: "kawaii",
    label: "Kawaii",
    description: "Doux et pastel — style slice of life",
  },
];

export const COLOR_MODES: { value: ColorMode; label: string }[] = [
  { value: "dark", label: "Mode sombre" },
  { value: "light", label: "Mode clair" },
];