// demo/pages/dashboard.page.ts
/**
 * DashboardPage — Protected view of the SPA (requires sign-in).
 *
 * Demonstrates the protected-view pattern without tying the kit to any
 * vertical domain: a client route guarded by `requireAuth` that renders
 * data fetched from a server-protected endpoint (`/api/auth/me`).
 */
import { van, createQuery, Spin, EmptyState } from "vanuikit";
import type { ChildDom } from "vanjs-core";
import { i18n } from "../shared/i18n.config.js";

type MeResponse = {
  user?: { name?: string; email?: string };
  expiresAt?: string;
};

export const DashboardPage = () => {
  const { div, h1, p, span } = van.tags;

  // Server-protected data (the endpoint requires a valid session).
  const meQuery = createQuery<MeResponse>("/api/auth/me", {
    transform: (json) => json.data,
  });

  const statCard = (label: ChildDom, value: ChildDom, hint?: ChildDom) =>
    div(
      { class: "rounded-xl border border-border bg-card p-5 shadow-sm space-y-1" },
      p({ class: "text-xs uppercase tracking-wide text-muted-foreground" }, label),
      p({ class: "text-2xl font-bold text-foreground truncate" }, value),
      hint ? p({ class: "text-sm text-foreground-soft" }, hint) : null,
    );

  return div(
    { class: "space-y-6 max-w-3xl mx-auto" },
    div(
      {},
      h1({ class: "text-2xl font-bold text-foreground" }, i18n.t("dashboard.title", "Dashboard")),
      p(
        { class: "text-sm text-foreground-soft mt-1" },
        i18n.t("dashboard.subtitle", "A protected view backed by the session API."),
      ),
    ),
    () =>
      meQuery.loading.val
        ? div({ class: "flex justify-center py-12" }, Spin())
        : meQuery.data.val?.user
          ? div(
              { class: "grid grid-cols-1 sm:grid-cols-2 gap-4" },
              statCard(
                i18n.t("dashboard.signedInAs", "Signed in as"),
                span({ class: "block" }, meQuery.data.val.user.name ?? "—"),
                meQuery.data.val.user.email,
              ),
              statCard(
                i18n.t("dashboard.sessionLabel", "Session"),
                i18n.t("dashboard.active", "Active"),
                i18n.t("dashboard.sessionHint", "Validated against the server session store."),
              ),
            )
          : EmptyState({
              title: i18n.t("dashboard.noSession", "No active session"),
              description: i18n.t("dashboard.noSessionHint", "Sign in to see your profile."),
            }),
  );
};
