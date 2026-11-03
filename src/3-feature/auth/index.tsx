"use client";

import { CircleUserRound, LogIn, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useI18n } from "@/src/5-shared/hook";
import type { AccountProfile as AuthUser } from "@/src/5-shared/type";
import { requestFooterPin } from "@/src/5-shared/util";

// Client-side route changes remount page footers. Keep the last verified
// session in this module so those remounts do not flash the initial skeleton.
let cachedSessionUser: AuthUser | null | undefined;

export function Auth() {
  const { t } = useI18n();
  const [user, setUser] = useState<AuthUser | null>(
    () => cachedSessionUser ?? null,
  );
  const [loading, setLoading] = useState(() => cachedSessionUser === undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    left: 0,
    bottom: 0,
    maxHeight: 0,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastItemOnOpen = useRef(false);
  const closeMenu = (restoreFocus = false) => {
    setMenuOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };
  const openMenu = (last = false) => {
    const bounds = triggerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    lastItemOnOpen.current = last;
    setMenuPosition({
      left: Math.max(8, Math.min(bounds.right - 192, window.innerWidth - 200)),
      bottom: window.innerHeight - bounds.top + 7,
      maxHeight: Math.max(44, bounds.top - 15),
    });
    setMenuOpen(true);
  };

  useEffect(() => {
    let active = true;
    let requestId = 0;
    const loadSession = () => {
      const current = ++requestId;
      void fetch("/api/auth/session", { cache: "no-store" })
        .then(
          (response) => response.json() as Promise<{ user: AuthUser | null }>,
        )
        .then(({ user: nextUser }) => {
          if (active && current === requestId) {
            cachedSessionUser = nextUser;
            setUser(nextUser);
            // Publish the loaded profile and enabled trigger in one render so
            // keyboard users never land on a transient disabled account button.
            setLoading(false);
            try {
              if (nextUser)
                localStorage.setItem(
                  "web-notepad-account-profile",
                  JSON.stringify(nextUser),
                );
              else localStorage.removeItem("web-notepad-account-profile");
            } catch {
              /* Keep authentication usable without profile caching. */
            }
          }
        })
        .catch(() => {
          if (active && current === requestId) {
            if (cachedSessionUser === undefined) cachedSessionUser = null;
            setLoading(false);
          }
        });
    };
    loadSession();
    window.addEventListener("notepad-auth-changed", loadSession);
    return () => {
      active = false;
      window.removeEventListener("notepad-auth-changed", loadSession);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const items =
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    (lastItemOnOpen.current ? items?.[items.length - 1] : items?.[0])?.focus();
    const outside = (event: PointerEvent) => {
      if (
        !triggerRef.current?.contains(event.target as Node) &&
        !menuRef.current?.contains(event.target as Node)
      )
        setMenuOpen(false);
    };
    const closeOnResize = () => setMenuOpen(false);
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", closeOnResize);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", closeOnResize);
    };
  }, [menuOpen]);

  const logout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        setMenuOpen(false);
        cachedSessionUser = null;
        setUser(null);
        window.dispatchEvent(new Event("notepad-auth-changed"));
      }
    } catch {
      /* Keep the account and menu available for retry. */
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user)
    return (
      <div
        className="auth-command is-loading"
        role="status"
        aria-label={t.accountLoading}
        aria-busy="true"
      >
        <span className="auth-skeleton-avatar" aria-hidden="true" />
        <span className="auth-skeleton-name" aria-hidden="true" />
      </div>
    );

  if (user)
    return (
      <>
        <button
          ref={triggerRef}
          className="auth-command"
          type="button"
          title={user.nickname + " · " + t.accountMenu}
          aria-label={user.nickname + " · " + t.accountMenu}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls="account-menu"
          disabled={loading}
          onClick={() => (menuOpen ? closeMenu() : openMenu())}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              openMenu(event.key === "ArrowUp");
            }
          }}
        >
          {user.profileImageUrl ? (
            // Kakao profile hosts are dynamic.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profileImageUrl}
              alt=""
              referrerPolicy="no-referrer"
            />
          ) : (
            <CircleUserRound aria-hidden="true" />
          )}
          <span>{user.nickname}</span>
        </button>
        {menuOpen &&
          createPortal(
            <div
              ref={menuRef}
              id="account-menu"
              className="auth-menu"
              role="menu"
              aria-label={t.accountMenu}
              style={menuPosition}
              onKeyDown={(event) => {
                if (event.key === "Escape" || event.key === "Tab") {
                  event.preventDefault();
                  event.stopPropagation();
                  closeMenu(true);
                  return;
                }
                const items = Array.from(
                  menuRef.current?.querySelectorAll<HTMLElement>(
                    '[role="menuitem"]:not(:disabled)',
                  ) ?? [],
                );
                const index = items.indexOf(
                  document.activeElement as HTMLElement,
                );
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? items.length - 1
                      : event.key === "ArrowDown"
                        ? (index + 1) % items.length
                        : event.key === "ArrowUp"
                          ? (index - 1 + items.length) % items.length
                          : -1;
                if (next >= 0) {
                  event.preventDefault();
                  items[next]?.focus();
                }
              }}
            >
              <button
                type="button"
                role="menuitem"
                disabled={loading}
                onContextMenu={(event) =>
                  requestFooterPin(event, "account:logout")
                }
                onClick={() => void logout()}
              >
                <LogOut size={18} />
                <span>{t.logout}</span>
              </button>
              <Link
                href="/my-page"
                role="menuitem"
                onContextMenu={(event) =>
                  requestFooterPin(event, "account:my-page")
                }
                onClick={() => closeMenu()}
              >
                <UserRound size={18} />
                <span>{t.myPage}</span>
              </Link>
            </div>,
            document.body,
          )}
      </>
    );

  return (
    <a
      aria-disabled={false}
      className="auth-command"
      href="/api/auth/oauth/kakao"
      title={t.kakaoLogin}
      aria-label={t.kakaoLogin}
    >
      <LogIn aria-hidden="true" />
      <span>{t.login}</span>
    </a>
  );
}
