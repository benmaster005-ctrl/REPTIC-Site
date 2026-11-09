import Link from "next/link";
import { getSessionUserId } from "@/lib/auth";

type Variant = "bar" | "block";

const styles: Record<Variant, string> = {
  bar: "font-semibold text-white hover:text-cyan",
  block: "btn-secondary w-full",
};

/** Lit la session : à rendre derrière un <Suspense>. */
export async function AccountLink({ variant = "bar" }: { variant?: Variant }) {
  const userId = await getSessionUserId();
  if (!userId) return <AccountLinkFallback variant={variant} />;
  return (
    <Link href="/espace" className={styles[variant]}>
      Mon espace
    </Link>
  );
}

export function AccountLinkFallback({ variant = "bar" }: { variant?: Variant }) {
  return (
    <Link href="/connexion" className={styles[variant]}>
      Espace membre
    </Link>
  );
}
