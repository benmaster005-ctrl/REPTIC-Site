import type { Metadata } from "next";
import { Suspense } from "react";
import { getSpaceContext } from "@/lib/space";
import { getNotifications } from "@/lib/data/member";
import { markAllNotificationsRead, openNotification } from "@/app/actions/member";
import { formatDateTime } from "@/lib/format";
import { Panel, SpaceHeader } from "@/components/space/ui";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div aria-busy className="h-96 animate-pulse bg-white" />}>
      <Notifications />
    </Suspense>
  );
}

async function Notifications() {
  const { user } = await getSpaceContext("/espace/notifications");
  const items = await getNotifications(user.id, 100);
  const unread = items.filter((n) => !n.readAt).length;
  return (
    <>
      <SpaceHeader
        label="Notifications"
        title={unread ? `${unread} notification${unread > 1 ? "s" : ""} non lue${unread > 1 ? "s" : ""}` : "Notifications"}
        description="Alertes relatives à votre compte, à votre adhésion et aux publications du réseau."
        action={
          unread ? (
            <form action={markAllNotificationsRead}>
              <button type="submit" className="btn-secondary py-2.5">
                Tout marquer comme lu
              </button>
            </form>
          ) : null
        }
      />
      <Panel className="mt-8 p-0 sm:p-0">
        {items.length ? (
          <ul>
            {items.map((n) => (
              <li key={n.id} className="border-b border-line last:border-b-0">
                <form action={openNotification}>
                  <input type="hidden" name="id" value={n.id} />
                  <input type="hidden" name="link" value={n.link ?? "/espace/notifications"} />
                  <button type="submit" className="group grid w-full grid-cols-[1rem_1fr] gap-4 px-6 py-5 text-left transition-colors hover:bg-paper sm:px-8">
                    <span aria-hidden className={`mt-1.5 size-2.5 rounded-full border-2 ${n.readAt ? "border-line-strong" : "border-cyan bg-cyan"}`} />
                    <span>
                      <span className={`block ${n.readAt ? "text-navy/80" : "font-semibold text-navy"}`}>{n.title}</span>
                      {n.body && <span className="mt-1 block text-[0.92rem] text-muted">{n.body}</span>}
                      <span className="mt-1.5 block font-mono text-[0.72rem] text-muted">{formatDateTime(n.createdAt)}</span>
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-8 text-muted">Aucune notification pour le moment.</p>
        )}
      </Panel>
    </>
  );
}
