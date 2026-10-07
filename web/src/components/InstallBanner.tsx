"use client";

import { useEffect, useState } from "react";

function isAppleMobile() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

const DISMISS_KEY = "listener_install_banner_dismissed";

export function InstallBanner() {
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    setIos(isAppleMobile());
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="rounded-xl border border-sky-700/50 bg-sky-950/50 p-4 text-sm text-sky-50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-white">
            Install like an app (free)
          </div>
          <p className="mt-1 text-sky-200/90">
            Add to Home Screen — then it opens full-screen and can keep
            recording until you close it.
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          className="shrink-0 text-sky-300 hover:text-white"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, "1");
            setShow(false);
          }}
        >
          ✕
        </button>
      </div>

      {ios ? (
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sky-100">
          <li>
            Tap <strong>Share</strong> in Safari
          </li>
          <li>
            Tap <strong>Add to Home Screen</strong>
          </li>
          <li>
            Open <strong>Listener</strong> from your home screen
          </li>
        </ol>
      ) : (
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sky-100">
          <li>Chrome menu → Install app / Add to Home screen</li>
          <li>Open from your home screen</li>
        </ol>
      )}
    </div>
  );
}
