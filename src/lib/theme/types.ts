export type Universe = "void" | "neon_tokyo" | "sakura" | "inferno" | "zen";

/**
 * Alias historique — l'ancien système 3 thèmes (shonen/seinen/kawaii) a été
 * remplacé par les 5 univers (migration 003). Conservé uniquement pour ne pas
 * casser les composants visuels (Button/Card/Badge/pages) qui seront migrés
 * dans une étape séparée après validation.
 * @deprecated Utiliser `Universe` à la place.
 */
export type Theme = "shonen" | "seinen" | "kawaii" | Universe;

/**
 * Ancien toggle dark/light — chaque univers a désormais un mode fixe
 * (migration 003). Conservé pour compatibilité des composants existants.
 * @deprecated Chaque univers a un mode fixe, ne plus utiliser.
 */
export type ColorMode = "dark" | "light";

export const UNIVERSES: {
  value: Universe;
  label: string;
  description: string;
}[] = [
  {
    value: "void",
    label: "Void",
    description: "Noir profond, rouge crimson — l'univers par défaut",
  },
  {
    value: "neon_tokyo",
    label: "Neon Tokyo",
    description: "Nuit cyberpunk, cyan électrique et rose néon",
  },
  {
    value: "sakura",
    label: "Sakura",
    description: "Douceur printanière, rose sakura et violet tendre",
  },
  {
    value: "inferno",
    label: "Inferno",
    description: "Feu et braise, orange incandescent et or",
  },
  {
    value: "zen",
    label: "Zen",
    description: "Jardin apaisé, vert matcha et ocre terreux",
  },
];

/**
 * Correspondance ancien thème → nouvel univers (migration de données 003 :
 * shonen → inferno, seinen → void, kawaii → sakura).
 */
export const LEGACY_THEME_TO_UNIVERSE: Record<
  "shonen" | "seinen" | "kawaii",
  Universe
> = {
  shonen: "inferno",
  seinen: "void",
  kawaii: "sakura",
};

/**
 * @deprecated Utiliser `UNIVERSES`. Conservé pour les composants existants
 * (migration visuelle dans une étape séparée).
 */
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

/**
 * @deprecated Chaque univers a un mode fixe (migration 003).
 */
export const COLOR_MODES: { value: ColorMode; label: string }[] = [
  { value: "dark", label: "Mode sombre" },
  { value: "light", label: "Mode clair" },
];