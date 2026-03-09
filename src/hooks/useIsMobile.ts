import { useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768;

function subscribe(callback: () => void) {
  const mediaQueryList = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
  const handler = () => callback();

  mediaQueryList.addEventListener("change", handler);
  return () => mediaQueryList.removeEventListener("change", handler);
}

function getSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
