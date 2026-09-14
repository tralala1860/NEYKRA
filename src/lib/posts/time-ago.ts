// NEYKRA — Utilitaire de date relative (Phase 2, étape 2).
// Retourne une chaîne lisible type "il y a 2h", "il y a 3j", etc.

/**
 * Formate une date ISO en expression relative en français.
 * @example "il y a 2h", "il y a 3j", "hier", "ça fait un moment"
 */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes}min`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days}j`;
  if (days < 365) return `il y a ${Math.floor(days / 30)}mois`;
  return `il y a ${Math.floor(days / 365)}an${Math.floor(days / 365) > 1 ? "s" : ""}`;
}
