"use client";

import { Copy, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { GroupEntry } from "@/src/4-entity/notepad";
import { getTabStatus, useNotepadStore } from "@/src/4-entity/notepad";
import { useI18n } from "@/src/5-shared/hook";
import { bffFetch } from "@/src/5-shared/util";

import type { GroupShareDialogProps } from "../../type";

export function GroupShareDialog({
  group,
  onClose,
  onShared,
}: GroupShareDialogProps) {
  const { t } = useI18n();
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "login" | "error">(
    "loading",
  );
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnGroupId = useRef(group.id);
  const initialGroup = useRef(group);
  const onSharedRef = useRef(onShared);
  const sharedResult = useRef<GroupEntry | null>(null);
  const completeAndClose = useCallback(() => {
    if (sharedResult.current) {
      onSharedRef.current(initialGroup.current.id, sharedResult.current);
      sharedResult.current = null;
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        completeAndClose();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), input:not([disabled])",
        ) ?? [],
      );
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previous?.isConnected) previous.focus();
      else
        document
          .querySelector<HTMLElement>(
            `[data-group-id="${CSS.escape(returnGroupId.current)}"] .group-actions > button`,
          )
          ?.focus();
    };
  }, [completeAndClose, group.id]);

  useEffect(() => {
    let active = true;
    const requestGroup = initialGroup.current;
    bffFetch("/api/groups/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        group: {
          ...requestGroup,
          tabs: requestGroup.tabs.map((tab) => ({
            ...tab,
            dashboardStatus: getTabStatus(
              tab,
              useNotepadStore.getState().settings.tabColorCycle,
            ),
          })),
        },
      }),
    })
      .then(async (response) => {
        if (!active) return;
        if (response.status === 401) {
          setStatus("login");
          return;
        }
        if (!response.ok) {
          setStatus("error");
          return;
        }
        const result = (await response.json()) as {
          url: string;
          group: GroupEntry;
        };
        if (!active) return;
        setUrl(result.url);
        setStatus("ready");
        returnGroupId.current = result.group.id;
        sharedResult.current = result.group;
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      inputRef.current?.select();
    }
  };

  return createPortal(
    <div
      className="group-share-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) completeAndClose();
      }}
    >
      <section
        ref={dialogRef}
        className="group-share-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t.shareGroupTitle(group.name)}
      >
        <header>
          <h2>{t.shareGroupTitle(group.name)}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={completeAndClose}
            aria-label={t.close}
          >
            <X size={18} />
          </button>
        </header>
        {status === "loading" && <p role="status">{t.cloudSaving}</p>}
        {status === "error" && <p role="alert">{t.shareUnavailable}</p>}
        {status === "login" && (
          <>
            <p>{t.shareLoginRequired}</p>
            <a className="group-share-login" href="/api/auth/oauth/kakao">
              {t.kakaoLogin}
            </a>
          </>
        )}
        {status === "ready" && url && (
          <>
            <label htmlFor="group-share-url">{t.shareLink}</label>
            <input
              ref={inputRef}
              id="group-share-url"
              readOnly
              value={url}
              onFocus={(event) => event.currentTarget.select()}
            />
            <button
              className="group-share-copy"
              type="button"
              onClick={() => void copy()}
            >
              <span>
                <Copy size={16} />
                {copied ? t.shareLinkCopied : t.copyShareLink}
              </span>
            </button>
          </>
        )}
        <button
          className="group-share-close"
          type="button"
          onClick={completeAndClose}
        >
          {t.close}
        </button>
      </section>
    </div>,
    document.body,
  );
}
