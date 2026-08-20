"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

const themeStorageKey = "digi-earn-theme";
const themeChangeEvent = "digi-earn-theme-change";

function subscribeToTheme(onChange: () => void) {
  window.addEventListener(themeChangeEvent, onChange);
  return () => window.removeEventListener(themeChangeEvent, onChange);
}

function readTheme() {
  return document.documentElement.dataset.theme === "light";
}

export default function ThemeToggle() {
  const isLight = useSyncExternalStore(subscribeToTheme, readTheme, () => false);

  function toggleTheme() {
    const nextTheme = isLight ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(themeStorageKey, nextTheme);
    window.dispatchEvent(new Event(themeChangeEvent));
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
      title={`Switch to ${isLight ? "dark" : "light"} mode`}
      className="rounded-lg p-2 text-gray-400 hover:bg-[#102019] hover:text-white"
    >
      {isLight ? <Moon size={19} /> : <Sun size={19} />}
    </button>
  );
}