// NEYKRA — calcul de majorité, aligné sur la fonction SQL
// `public.compute_is_minor` de supabase/schema.sql :
//   • mineur si le 18e anniversaire n'est pas encore atteint à la date du jour ;
//   • né.e un 29/02 → majorité le 28/02 (comportement PostgreSQL de
//     `date + interval '18 years'`).

type ParsedDate = { year: number; month: number; day: number };

function parseBirthdate(value: string): ParsedDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  // Vérifie que la date est un vrai jour du calendrier (ex. 2023-02-30 invalide).
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Pierre angulaire du calcul : date du 18e anniversaire (en UTC, sur la base
 * uniquement de l'année/mois/jour de naissance — aucun décalage horaire).
 */
export function eighteenthBirthday(value: string): Date | null {
  const birth = parseBirthdate(value);
  if (!birth) return null;

  const targetYear = birth.year + 18;
  let eighteen = new Date(Date.UTC(targetYear, birth.month - 1, birth.day));

  // 29/02 dans une année non bissextile → Date dérive vers le 01/03 ;
  // PostgreSQL, lui, renvoie le 28/02. On corrige pour rester identiques.
  if (birth.month === 2 && birth.day === 29 && !isLeapYear(targetYear)) {
    eighteen = new Date(Date.UTC(targetYear, 1, 28));
  }

  return eighteen;
}

/**
 * Retourne true si l'utilisateur est mineur à la date du jour
 * (moins de 18 ans révolus). Toute date invalide → `false` (la validation
 * doit avoir lieu avant, dans les Server Actions).
 */
export function isMinor(birthdate: string, now = new Date()): boolean {
  const eighteen = eighteenthBirthday(birthdate);
  if (!eighteen) return false;

  // "Aujourd'hui" en UTC (aligné sur current_date de la base Supabase).
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  return today < eighteen;
}