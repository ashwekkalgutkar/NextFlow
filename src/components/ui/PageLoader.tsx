"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// ─── Pure DOM loader — no React state, no batching delays ───────────────────
// Injects a <div> directly into document.body and animates it with CSS.
// This paints on the SAME frame as the click, before React even re-renders.

const STYLE_ID = "__page-loader-style__";
const BAR_ID = "__page-loader-bar__";
const OVERLAY_ID = "__page-loader-overlay__";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #${BAR_ID} {
      position: fixed;
      top: 0; left: 0;
      height: 3px;
      width: 0%;
      background: #ffffff;
      box-shadow: 0 0 12px 2px rgba(255,255,255,0.75);
      z-index: 999999;
      pointer-events: none;
      border-radius: 0;
      transition: width 0.1s linear, opacity 0.3s ease;
    }
    #${BAR_ID}.done {
      opacity: 0;
      transition: width 0.2s ease-out, opacity 0.4s ease 0.1s;
    }
    #${OVERLAY_ID} {
      position: fixed;
      inset: 0;
      z-index: 999998;
      background: rgba(0,0,0,0.28);
      backdrop-filter: blur(1.5px);
      -webkit-backdrop-filter: blur(1.5px);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    #${OVERLAY_ID}.visible {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
}

let bar: HTMLDivElement | null = null;
let overlay: HTMLDivElement | null = null;
let crawlInterval: ReturnType<typeof setInterval> | null = null;
let isActive = false;

function getOrCreateElements() {
  if (!bar) {
    bar = document.createElement("div");
    bar.id = BAR_ID;
    document.body.appendChild(bar);
  }
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    document.body.appendChild(overlay);
  }
  return { bar, overlay };
}

function doStart() {
  if (isActive) return;
  isActive = true;
  if (crawlInterval) clearInterval(crawlInterval);

  injectStyles();
  const { bar: b, overlay: o } = getOrCreateElements();

  b.classList.remove("done");
  b.style.transition = "none";
  // Start at 30% so it's visible on the SAME paint frame as the click
  b.style.width = "30%";
  b.style.opacity = "1";
  o.classList.add("visible");

  // Force paint at 30% before re-enabling transitions
  b.getBoundingClientRect();
  b.style.transition = "width 0.12s linear";

  let p = 30;
  crawlInterval = setInterval(() => {
    p += p < 60 ? 5 : p < 80 ? 2 : p < 88 ? 0.8 : 0;
    if (p >= 88) { p = 88; clearInterval(crawlInterval!); }
    b.style.width = p + "%";
  }, 120);
}

function doFinish() {
  if (!isActive) return;
  isActive = false;
  if (crawlInterval) { clearInterval(crawlInterval); crawlInterval = null; }

  const { bar: b, overlay: o } = getOrCreateElements();
  b.style.transition = "width 0.18s ease-out";
  b.style.width = "100%";
  o.classList.remove("visible");

  // Snap to 100% then fade out — never goes backwards
  setTimeout(() => { b.classList.add("done"); }, 80);
  setTimeout(() => { b.style.opacity = "0"; b.style.width = "0%"; }, 500);
}

export function startPageLoader() { doStart(); }

export default function PageLoader() {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);

  // Finish loading when pathname actually changes
  useEffect(() => {
    if (prevPath.current === null) {
      prevPath.current = pathname;
      return;
    }
    if (pathname !== prevPath.current) {
      prevPath.current = pathname;
      doFinish();
    }
  }, [pathname]);

  // Intercept ALL clicks — capture phase fires before React handlers
  useEffect(() => {
    let cancelTimer: ReturnType<typeof setTimeout> | null = null;

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Only start loader for internal anchor-tag navigation
      const a = target.closest("a");
      if (!a) return; // buttons, divs, etc. → never show loader

      const href = a.getAttribute("href") ?? "";
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) return;
      if (a.getAttribute("target") === "_blank") return;

      doStart();
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null; // No React DOM — everything is raw DOM
}
