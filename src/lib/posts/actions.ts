// NEYKRA — Server Actions pour les posts / likes / commentaires (Phase 2, étape 2).
// Respecte RLS définie dans supabase/schema.sql (post_visible_to_reader,
// posts_delete_own, likes_delete_own, comments_delete_own…).

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  CreatePostFormState,
  ReactionToggleState,
  CommentFormState,
  DeletePostFormState,
  DeleteCommentFormState,
  PostWithAuthor,
  FeedPostsPage,
  PostMediaType,
  CommentWithAuthor,
  ReactionCounts,
  ReactionType,
} from "./types";
import { REACTION_TYPES } from "./types";

const POST_CONTENT_MAX = 2000;
const POST_MEDIA_MAX_BYTES = 5 * 1024 * 1024;
const POST_MEDIA_MIME_TYPES: Record<string, string> = {
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
  "image/gif": "gif",
  "video/mp4": "video",
  "video/webm": "video",
};

function detectMediaType(file: File): string | null {
  return POST_MEDIA_MIME_TYPES[file.type] ?? null;
}


// ---------------------------------------------------------------------------
// Création d'un post : texte et/ou média (bucket "posts").
// ---------------------------------------------------------------------------

export async function createPost(
  _prevState: CreatePostFormState,
  formData: FormData
): Promise<CreatePostFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté." };
  }

  const rawContent = String(formData.get("content") ?? "").trim();
  const file = formData.get("media") as File | null;

  const hasContent = rawContent.length > 0;
  const hasMedia = file instanceof File && file.size > 0;

  if (!hasContent && !hasMedia) {
    return { error: "Un post doit contenir au moins du texte ou un média." };
  }

  if (hasContent && rawContent.length > POST_CONTENT_MAX) {
    return {
      error: `Le contenu d'un post ne peut pas dépasser ${POST_CONTENT_MAX} caractères.`,
    };
  }

  let mediaUrl: string | null = null;
  let mediaType: "image" | "video" | "gif" | null = null;

  if (hasMedia) {
    const detected = detectMediaType(file);
    if (!detected) {
      return {
        error: "Format média non accepté (PNG, JPEG, WebP, GIF, MP4, WebM).",
      };
    }
    if (file.size > POST_MEDIA_MAX_BYTES) {
      return { error: "Le média ne peut pas dépasser 5 Mo." };
    }

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/jpeg"
          ? "jpg"
          : file.type === "image/webp"
            ? "webp"
            : file.type === "image/gif"
              ? "gif"
              : "mp4";

    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("posts")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("createPost upload error:", uploadError.message);
      if (uploadError.message.toLowerCase().includes("bucket")) {
        return {
          error:
            "Stockage des posts indisponible (bucket « posts » manquant — exécuter supabase/migrations/004b_posts_storage.sql).",
        };
      }
      return { error: "Échec de l'envoi du média." };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("posts").getPublicUrl(path);

    mediaUrl = publicUrl;
    mediaType = detected as "image" | "video" | "gif";
  }

  const { error } = await supabase.from("posts").insert({
    author_id: user.id,
    content: hasContent ? rawContent : null,
    media_url: mediaUrl,
    media_type: mediaType,
  });

  if (error) {
    console.error("createPost insert error:", error.message);
    return { error: "Impossible de publier le post." };
  }

  revalidatePath("/feed");
  return { success: "Post publié !" };
}

// ---------------------------------------------------------------------------
// Interne partagé : charge les posts visibles par l'utilisateur connecté
// (RLS posts_select = soi / ami accepté / public non bloqué) avec tous les
// métadonnées du fil : join profiles + otaku_status, réactions décomptées
// par type, réaction de l'utilisateur courant, compteur + commentaires.
// Utilisé par getFeedPosts / getMoreFeedPosts (fil principal) et
// getPostsByAuthor (profil).
//
// Pagination : un post de plus que la limite demandée est récupéré (sonde)
// puis retiré de la page renvoyée — s'il existe, c'est qu'il reste des posts
// plus anciens (hasMore = true). Le curseur `before` filtre en
// created_at < before (strictement), donc aucun doublon entre deux pages.
// ---------------------------------------------------------------------------

// Tailles de page du fil principal (/feed) : page initiale et pages suivantes.
const FEED_PAGE_SIZE = 50;
const FEED_MORE_PAGE_SIZE = 25;
// La page profil garde une liste courte, non paginée (chantier séparé).
const PROFILE_POSTS_LIMIT = 30;

type FetchVisiblePostsOptions = {
  /** Si renseigné, filtre sur un auteur précis (page profil). Sinon tout le fil. */
  authorId?: string | null;
  /** Limite du nombre de posts (null = pas de limite explicite). */
  limit?: number | null;
  /**
   * Curseur de pagination : ne renvoie que les posts créés STRICTEMENT avant
   * cette date (ISO 8601) — typiquement le `created_at` du dernier post affiché.
   */
  before?: string | null;
};

type FetchVisiblePostsResult = {
  posts: PostWithAuthor[];
  hasMore: boolean;
  error?: string;
};

async function fetchVisiblePostsWithMeta(
  options: FetchVisiblePostsOptions = {}
): Promise<FetchVisiblePostsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { posts: [], hasMore: false };
  }

  // posts_select RLS filtre déjà : auteur = soi, ami accepté, ou profil public non bloqué
  let query = supabase
    .from("posts")
    .select(`
      id,
      author_id,
      content,
      media_url,
      media_type,
      created_at,
      profiles (
        username,
        display_name,
        avatar_url,
        otaku_status (rang)
      )
    `)
    .order("created_at", { ascending: false });

  if (options.authorId) {
    query = query.eq("author_id", options.authorId);
  }
  // Curseur de pagination : strictement avant la date donnée.
  if (options.before) {
    query = query.lt("created_at", options.before);
  }
  if (options.limit != null) {
    // Sonde : un post de plus que la page demandée, pour détecter hasMore.
    query = query.limit(options.limit + 1);
  }

  const { data: posts, error } = await query;

  if (error) {
    console.error("fetchVisiblePostsWithMeta error:", error.message);
    return {
      posts: [],
      hasMore: false,
      error: "Impossible de charger les publications.",
    };
  }

  if (!posts || posts.length === 0) {
    return { posts: [], hasMore: false };
  }

  // Le post de sonde (au-delà de la limite) est retiré de la page renvoyée :
  // sa seule présence suffit à savoir qu'il reste des posts plus anciens.
  const pageSize = options.limit ?? null;
  const hasMore = pageSize != null && posts.length > pageSize;
  const pageRows = pageSize != null ? posts.slice(0, pageSize) : posts;

  const postIds = pageRows.map((p) => p.id);

  // Réactions des posts (type par ligne — compteurs par type + réaction perso).
  // La RLS likes_select filtre déjà la visibilité.
  const { data: reactionRows, error: reactionsError } = await supabase
    .from("likes")
    .select("post_id, user_id, reaction_type")
    .in("post_id", postIds);

  if (reactionsError) {
    console.error("getFeedPosts reactions error:", reactionsError.message);
  }

  const reactionsByPost = new Map<string, ReactionCounts>();
  const userReactionByPost = new Map<string, ReactionType>();
  (reactionRows ?? []).forEach((r) => {
    const type = r.reaction_type as ReactionType;
    if (!REACTION_TYPES.includes(type)) return;

    const counts = reactionsByPost.get(r.post_id) ?? {};
    counts[type] = (counts[type] ?? 0) + 1;
    reactionsByPost.set(r.post_id, counts);

    if (r.user_id === user.id) {
      userReactionByPost.set(r.post_id, type);
    }
  });

  // Nombre de commentaires par post
  const { data: commentCounts } = await supabase
    .from("comments")
    .select("post_id")
    .in("post_id", postIds);

  const commentCountMap = new Map<string, number>();
  (commentCounts ?? []).forEach((c) => {
    commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) ?? 0) + 1);
  });

  // Commentaires de tous les posts (join profiles, comme pour les posts).
  // La RLS sur comments filtre déjà la visibilité.
  const { data: commentRows, error: commentsError } = await supabase
    .from("comments")
    .select(
      `
      id,
      post_id,
      author_id,
      content,
      created_at,
      profiles (
        username,
        display_name,
        avatar_url,
        otaku_status (rang)
      )
    `
    )
    .in("post_id", postIds)
    .order("created_at", { ascending: true });

  if (commentsError) {
    console.error("getFeedPosts comments error:", commentsError.message);
  }

  const commentsMap = new Map<
    string,
    CommentWithAuthor[]
  >();
  (commentRows ?? []).forEach((row) => {
    const profile = row.profiles as unknown as
      | {
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          otaku_status?: { rang: string } | null;
        }
      | null;

    const comment: CommentWithAuthor = {
      id: row.id,
      post_id: row.post_id,
      author_id: row.author_id,
      content: row.content,
      created_at: row.created_at,
      author_username: profile?.username ?? "",
      author_display_name: profile?.display_name ?? null,
      author_avatar_url: profile?.avatar_url ?? null,
      author_otaku_rank: profile?.otaku_status?.rang ?? null,
    };

    const list = commentsMap.get(row.post_id) ?? [];
    list.push(comment);
    commentsMap.set(row.post_id, list);
  });

  const page = pageRows.map((row) => {
    const profiles = row.profiles as unknown as
      | {
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          otaku_status?: { rang: string } | null;
        }
      | null;

    return {
      id: row.id,
      author_id: row.author_id,
      content: row.content,
      media_url: row.media_url,
      media_type: (row.media_type as PostMediaType) ?? null,
      created_at: row.created_at,
      author_username: profiles?.username ?? "",
      author_display_name: profiles?.display_name ?? null,
      author_avatar_url: profiles?.avatar_url ?? null,
      author_otaku_rank: profiles?.otaku_status?.rang ?? null,
      reactions: reactionsByPost.get(row.id) ?? {},
      user_reaction: userReactionByPost.get(row.id) ?? null,
      comment_count: commentCountMap.get(row.id) ?? 0,
      comments: commentsMap.get(row.id) ?? [],
    };
  });

  return { posts: page, hasMore };
}



// ---------------------------------------------------------------------------
// Fil d'actualité (/feed) — pagination par curseur sur created_at.
// getFeedPosts : page initiale (50 posts les plus récents, comportement
// historique conservé). getMoreFeedPosts : page suivante (25 posts créés
// STRICTEMENT avant `before`, curseur = created_at du dernier post affiché).
// Les deux renvoient `hasMore` (voir la sonde dans fetchVisiblePostsWithMeta).
// ---------------------------------------------------------------------------

export async function getFeedPosts(): Promise<FeedPostsPage> {
  return fetchVisiblePostsWithMeta({ limit: FEED_PAGE_SIZE });
}

/**
 * Page suivante du fil, strictement avant le curseur `before` (created_at au
 * format ISO 8601 du dernier post affiché). Entrée validée : une Server Action
 * est appelable directement en POST, on ne fait pas confiance au client.
 * Un curseur invalide renvoie une page vide (le bouton disparaît) sans erreur.
 */
export async function getMoreFeedPosts(
  before: string
): Promise<FeedPostsPage> {
  if (typeof before !== "string" || Number.isNaN(Date.parse(before))) {
    return { posts: [], hasMore: false };
  }
  return fetchVisiblePostsWithMeta({ limit: FEED_MORE_PAGE_SIZE, before });
}

// ---------------------------------------------------------------------------
// Posts d'un auteur précis (page profil) : même visibilité RLS que le fil
// principal (le visiteur ne voit que les posts autorisés — ses propres posts
// si c'est son profil, sinon selon public/ami/blocage). Tri date décroissante,
// limite raisonnable de 30 (profil, pas le fil principal). Pas de pagination
// ici : la page profil affiche les 30 derniers posts (chantier séparé), donc
// seul le tableau de posts est conservé — la signature reste inchangée.
// ---------------------------------------------------------------------------

export async function getPostsByAuthor(
  authorId: string
): Promise<PostWithAuthor[]> {
  if (!authorId) {
    return [];
  }
  const { posts } = await fetchVisiblePostsWithMeta({
    authorId,
    limit: PROFILE_POSTS_LIMIT,
  });
  return posts;
}

// ---------------------------------------------------------------------------
// Toggle réaction (migration 005 — 6 réactions manga, une seule par
// utilisateur par post, modèle Facebook) :
// - pas encore réagi        → insère la réaction choisie
// - même réaction déjà posée → supprime (toggle off)
// - réaction différente     → remplace par le nouveau type
// ---------------------------------------------------------------------------

export async function toggleReaction(
  postId: string,
  reactionType: string
): Promise<ReactionToggleState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté.", reactions: {}, user_reaction: null };
  }

  if (!postId) {
    return { error: "Post invalide.", reactions: {}, user_reaction: null };
  }

  // Validation côté serveur : le type doit faire partie des 6 réactions.
  if (!REACTION_TYPES.includes(reactionType as ReactionType)) {
    return { error: "Réaction invalide.", reactions: {}, user_reaction: null };
  }
  const type = reactionType as ReactionType;

  // Réaction existante de l'utilisateur sur ce post (UNIQUE post_id + user_id,
  // migration 005 → at most une ligne).
  const { data: existing } = await supabase
    .from("likes")
    .select("id, reaction_type")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  let userReaction: ReactionType | null = type;

  if (existing) {
    if (existing.reaction_type === type) {
      // Toggle off : même réaction → suppression
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("id", existing.id);

      if (error) {
        console.error("toggleReaction delete error:", error.message);
        return {
          error: "Impossible de retirer la réaction.",
          reactions: {},
          user_reaction: existing.reaction_type as ReactionType,
        };
      }
      userReaction = null;
    } else {
      // Remplacement : une seule réaction par utilisateur par post
      const { error } = await supabase
        .from("likes")
        .update({ reaction_type: type })
        .eq("id", existing.id);

      if (error) {
        console.error("toggleReaction update error:", error.message);
        return {
          error: "Impossible de changer la réaction.",
          reactions: {},
          user_reaction: existing.reaction_type as ReactionType,
        };
      }
    }
  } else {
    // Nouvelle réaction (RLS likes_insert_own check user_id)
    const { error } = await supabase.from("likes").insert({
      post_id: postId,
      user_id: user.id,
      reaction_type: type,
    });

    if (error) {
      console.error("toggleReaction insert error:", error.message);
      return { error: "Impossible d'ajouter la réaction.", reactions: {}, user_reaction: null };
    }
  }

  // Recompte par type de réaction sur le post
  const { data: rows, error: countError } = await supabase
    .from("likes")
    .select("reaction_type")
    .eq("post_id", postId);

  if (countError) {
    console.error("toggleReaction count error:", countError.message);
    return { error: "Impossible de compter les réactions.", reactions: {}, user_reaction: userReaction };
  }

  const reactions: ReactionCounts = {};
  (rows ?? []).forEach((r) => {
    const t = r.reaction_type as ReactionType;
    if (!REACTION_TYPES.includes(t)) return;
    reactions[t] = (reactions[t] ?? 0) + 1;
  });

  // Revalidation du feed
  revalidatePath("/feed");
  return { reactions, user_reaction: userReaction };
}

// ---------------------------------------------------------------------------
// Ajout d'un commentaire sur un post.
// ---------------------------------------------------------------------------

export async function addComment(
  _prevState: CommentFormState,
  formData: FormData
): Promise<CommentFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté." };
  }

  const postId = String(formData.get("postId") ?? "");
  const content = String(formData.get("content") ?? "").trim();

  if (!postId) {
    return { error: "Post invalide." };
  }

  if (!content) {
    return { error: "Le commentaire ne peut pas être vide." };
  }

  if (content.length > 2000) {
    return { error: "Le commentaire ne peut pas dépasser 2000 caractères." };
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    content,
  });

  if (error) {
    console.error("addComment error:", error.message);
    return { error: "Impossible d'ajouter le commentaire." };
  }

  revalidatePath("/feed");
  return { success: "Commentaire ajouté !" };
}

// ---------------------------------------------------------------------------
// Suppression d'un post (uniquement par l'auteur — policy posts_delete_own).
// ---------------------------------------------------------------------------

export async function deletePost(
  postId: string
): Promise<DeletePostFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté." };
  }

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", user.id);

  if (error) {
    console.error("deletePost error:", error.message);
    return { error: "Impossible de supprimer le post." };
  }

  revalidatePath("/feed");
  return { success: "Post supprimé." };
}

// ---------------------------------------------------------------------------
// Suppression d'un commentaire — uniquement par SON AUTEUR.
// RLS comments_delete_own : for delete using (author_id = auth.uid()).
// L'auteur du post n'a aucun droit de suppression sur les commentaires des
// autres (aucune policy de modération) : l'UI ne propose donc le bouton qu'à
// l'auteur du commentaire.
// ---------------------------------------------------------------------------

export async function deleteComment(
  commentId: string
): Promise<DeleteCommentFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non connecté." };
  }

  if (!commentId) {
    return { error: "Commentaire invalide." };
  }

  // Double verrou volontaire : le filtre author_id (défense en profondeur) ET
  // la policy comments_delete_own côté Postgres. `.select("id")` renvoie les
  // lignes réellement supprimées : PostgREST ne lève AUCUNE erreur quand la RLS
  // bloque la suppression (ou que la ligne n'existe plus), on validerait donc un
  // faux succès — et l'UI retirerait un commentaire toujours présent en base.
  const { data, error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id)
    .select("id");

  if (error) {
    console.error("deleteComment error:", error.message);
    return { error: "Impossible de supprimer le commentaire." };
  }

  if (!data || data.length === 0) {
    return {
      error:
        "Suppression impossible : ce commentaire n'existe plus ou ne t'appartient pas.",
    };
  }

  revalidatePath("/feed");
  return { success: "Commentaire supprimé." };
}


