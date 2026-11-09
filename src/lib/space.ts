import "server-only";
import { cache } from "react";
import { requireUser, type CurrentUser } from "@/lib/auth";

/** Contexte commun aux pages de l'espace : utilisateur et statut de membre. */
export const getSpaceContext = cache(async (path = "/espace"): Promise<{ user: CurrentUser; isMember: boolean }> => {
  const user = await requireUser(path);
  const isMember = user.status === "active" && user.role !== "candidate";
  return { user, isMember };
});

export const displayName = (u: CurrentUser) => [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
