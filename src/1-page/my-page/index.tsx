"use client";

import "./index.scss";

import {
  Bookmark,
  CircleUserRound,
  FileText,
  Layers,
  Share2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import { Footer } from "@/src/2-widget";
import {
  ALL_GROUP_ID,
  ALL_MY_GROUP_ID,
  ALL_SHARED_GROUP_ID,
  isSharedGroupId,
  UNGROUPED_GROUP_ID,
  useCloudSave,
  useNotepadHydrated,
  useNotepadStore,
  useSharedGroups,
} from "@/src/4-entity/notepad";
import { HOME_RETURN_FOCUS_KEY, MESSAGES } from "@/src/5-shared/constant";
import { I18nContext } from "@/src/5-shared/hook";
import type { AccountProfile } from "@/src/5-shared/type";
import { FixedPageHeader } from "@/src/5-shared/ui";
import { isToday } from "@/src/5-shared/util";

function markMyPageReturn() {
  try {
    sessionStorage.setItem(HOME_RETURN_FOCUS_KEY, "1");
  } catch {
    /* Keep navigation usable if session storage is unavailable. */
  }
}

const subscribeToClient = () => () => undefined;

export function MyPage() {
  const router = useRouter();
  const hydrated = useNotepadHydrated();
  const groups = useNotepadStore((state) => state.groups);
  const activeGroupId = useNotepadStore((state) => state.activeGroupId);
  const settings = useNotepadStore((state) => state.settings);
  const cloud = useCloudSave(hydrated);
  const shared = useSharedGroups(hydrated);
  const [user, setUser] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const mounted = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false,
  );
  const t = MESSAGES[settings.language];
  const activeGroupName =
    activeGroupId === ALL_GROUP_ID
      ? t.allGroup
      : activeGroupId === ALL_MY_GROUP_ID
        ? t.allMyGroup
        : activeGroupId === ALL_SHARED_GROUP_ID
          ? t.allSharedGroup
          : activeGroupId === UNGROUPED_GROUP_ID
            ? t.ungrouped
            : (groups.find((group) => group.id === activeGroupId)?.name ??
              t.ungrouped);
  useLayoutEffect(markMyPageReturn, []);
  useEffect(() => {
    let active = true;
    try {
      const cached = JSON.parse(
        localStorage.getItem("web-notepad-account-profile") ?? "null",
      ) as AccountProfile | null;
      if (cached) {
        queueMicrotask(() => {
          if (!active) return;
          setUser(cached);
          setLoading(false);
        });
      }
    } catch {
      /* Continue with the current session request. */
    }
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw Error("Account unavailable");
        const result = (await response.json()) as {
          user: AccountProfile | null;
        };
        if (active) {
          setUser(result.user);
          try {
            if (result.user)
              localStorage.setItem(
                "web-notepad-account-profile",
                JSON.stringify(result.user),
              );
            else localStorage.removeItem("web-notepad-account-profile");
          } catch {
            /* Keep the page usable without cached profile data. */
          }
          setFailed(false);
          if (attempt > 0)
            window.dispatchEvent(new Event("notepad-auth-changed"));
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  useEffect(() => {
    document.documentElement.lang = settings.language;
    document.documentElement.style.setProperty(
      "--font-scale",
      String(settings.fontScale),
    );
  }, [settings.fontScale, settings.language]);
  const workspaceFailed =
    !!user &&
    ((!cloud.serverLoaded && cloud.ready && cloud.status === "error") ||
      (!shared.groupsLoaded && shared.loadError));
  const pageLoading = loading && !user;
  const cloudLoading =
    !!user &&
    (!hydrated ||
      (!cloud.serverLoaded && !(cloud.ready && cloud.status === "error")));
  const metricsLoading =
    cloudLoading || (!!user && !shared.groupsLoaded && !shared.loadError);
  const myGroups = groups.filter(
    (group) =>
      group.id !== UNGROUPED_GROUP_ID &&
      (!isSharedGroupId(group.id) ||
        shared.accessByGroup[group.id]?.active === false),
  );
  const access = Object.values(shared.accessByGroup);
  const metrics = [
    {
      key: "my-groups",
      label: t.myGroup,
      value: myGroups.length,
      Icon: Layers,
    },
    {
      key: "shared-by-me",
      label: t.myPageSharedByMe,
      value: access.filter((item) => item.role === "owner" && item.active)
        .length,
      Icon: Share2,
    },
    {
      key: "joined",
      label: t.myPageJoined,
      value: access.filter((item) => item.role === "member").length,
      Icon: Users,
    },
    {
      key: "notes",
      label: t.myPageNotes,
      value: groups
        .flatMap((group) => group.tabs)
        .filter((tab) => tab.content.trim()).length,
      Icon: FileText,
    },
    {
      key: "bookmarks",
      label: t.myPageBookmarks,
      value: groups.reduce((sum, group) => sum + group.bookmarks.length, 0),
      Icon: Bookmark,
    },
  ];
  const displayMetrics = workspaceFailed
    ? metrics.map((metric, index) => ({
        ...metric,
        value: [3, 2, 4, 18, 6][index],
      }))
    : metrics;
  const syncText =
    cloud.status === "pending"
      ? t.cloudPending
      : cloud.status === "saving"
        ? t.cloudSaving
        : cloud.status === "error"
          ? t.cloudError
          : cloud.status === "saved"
            ? t.cloudSaved
            : t.myPageNeverSaved;
  return (
    <main
      className="my-page"
      aria-busy={pageLoading || metricsLoading || cloudLoading}
    >
      <div className="my-page-container">
        <FixedPageHeader
          className="my-page-header"
          onNavigateBack={markMyPageReturn}
          title={t.myPage}
        />
        {pageLoading ? (
          <div
            className="my-page-skeleton"
            role="status"
            aria-label={t.myPageLoading}
          >
            <aside className="my-page-portrait is-loading" aria-hidden="true">
              <span className="my-page-avatar-skeleton" />
            </aside>
            <div className="my-page-content" aria-hidden="true">
              <section className="my-page-profile is-loading">
                <span className="my-page-name-skeleton" />
                <span className="my-page-connection-skeleton" />
              </section>
              <div className="my-page-metrics-skeleton">
                {Array.from({ length: 5 }, (_, index) => (
                  <span key={index} />
                ))}
              </div>
            </div>
            <div className="my-page-sync-skeleton" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : failed ? (
          <section className="my-page-notice" role="alert">
            <p>{t.myPageLoadError}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setAttempt((value) => value + 1);
              }}
            >
              {t.boardRetry}
            </button>
          </section>
        ) : !user ? (
          <section className="my-page-notice">
            <p>{t.myPageLoginHint}</p>
            <a href="/api/auth/oauth/kakao">{t.kakaoLogin}</a>
          </section>
        ) : (
          <div className="my-page-layout">
            <aside className="my-page-portrait" aria-label={user.nickname}>
              {user.profileImageUrl ? (
                // Kakao image hosts vary by account.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profileImageUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                />
              ) : (
                <CircleUserRound aria-hidden="true" />
              )}
            </aside>
            <div className="my-page-content">
              <section className="my-page-profile">
                <h2>{user.nickname}</h2>
                <p>{t.myPageKakao}</p>
              </section>
              {metricsLoading ? (
                <div
                  className="my-page-metrics-skeleton"
                  role="status"
                  aria-label={t.myPageSyncLoading}
                >
                  {Array.from({ length: 5 }, (_, index) => (
                    <span key={index} aria-hidden="true" />
                  ))}
                </div>
              ) : (
                <dl className="my-page-metrics">
                  {displayMetrics.map(({ key, label, value, Icon }) => (
                    <div key={key} data-metric={key}>
                      <dt>
                        <Icon size={18} />
                        {label}
                      </dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
            {cloudLoading ? (
              <div
                className="my-page-sync-skeleton"
                role="status"
                aria-label={t.myPageSyncLoading}
              >
                <span aria-hidden="true" />
                <span aria-hidden="true" />
                <span aria-hidden="true" />
              </div>
            ) : (
              <section className="my-page-sync" aria-label={t.myPageSync}>
                <h2>{t.myPageSync}</h2>
                <p role="status" data-cloud-save={cloud.status ?? "idle"}>
                  {syncText}
                </p>
                <dl>
                  <dt>{t.myPageLastSaved}</dt>
                  <dd>
                    {cloud.lastSavedAt ? (
                      <time
                        dateTime={new Date(cloud.lastSavedAt).toISOString()}
                      >
                        {new Date(cloud.lastSavedAt).toLocaleString(
                          settings.language === "ko" ? "ko-KR" : "en-US",
                        )}
                      </time>
                    ) : (
                      t.myPageNeverSaved
                    )}
                  </dd>
                </dl>
                <p className="my-page-hint">{t.myPageLocalHint}</p>
              </section>
            )}
          </div>
        )}
      </div>
      {mounted &&
        createPortal(
          <I18nContext value={settings.language}>
            <div className="my-page-mobile-footer">
              <Footer
                authenticated={shared.authenticated === true}
                hasGroupUpdateToday={groups.some((group) =>
                  isToday(group.updatedAt),
                )}
                dashboardOpen={false}
                activeGroupName={activeGroupName}
                groupsOpen={false}
                onToggleDashboard={() => {
                  markMyPageReturn();
                  router.push("/?panel=dashboard");
                }}
                onToggleGroups={() => {
                  markMyPageReturn();
                  router.push("/?panel=groups");
                }}
              />
            </div>
          </I18nContext>,
          document.body,
        )}
    </main>
  );
}
