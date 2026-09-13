# NEYKRA 🐉

Réseau social complet inspiré de Facebook, avec une identité visuelle manga/anime.
Grand public francophone (V1), mineurs compris → exigences de sécurité renforcées.

## Stack

| Couche | Technologie |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Style | Tailwind CSS |
| Animations | Framer Motion |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Hébergement | Vercel (prévu) |

## Démarrage rapide

1. Copier `.env.example` → `.env.local` et renseigner les valeurs Supabase
   (project Settings → API).
2. Exécuter `supabase/schema.sql` dans le SQL Editor de Supabase
   (création des tables + RLS).
3. `npm install`
4. `npm run dev` → http://localhost:3000

## Structure

- `src/app` — routes et pages (App Router)
- `src/lib/supabase` — clients Supabase
- `supabase/schema.sql` — schéma complet + politiques RLS (Phase 0)
- `NEYKRA_SPEC.md` — document de spécifications maître
- `CHANGELOG.md` — suivi des sessions de développement

## État d'avancement

- **Phase 0 — Fondations** ✅ → voir `CHANGELOG.md`