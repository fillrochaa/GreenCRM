"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

const STORAGE_KEY = "greencrm-theme";

function currentTheme(): Theme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "light" || explicit === "dark") return explicit;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle({ labelClassName }: { labelClassName: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => setTheme(currentTheme()), []);

  function toggle() {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    setTheme(next);
  }

  const Icon = theme === "dark" ? Sun : Moon;
  const label = theme === "dark" ? "Tema claro" : "Tema escuro";

  return (
    <button
      type="button"
      onClick={toggle}
      className="mx-3 flex h-11 cursor-pointer items-center rounded-md text-label transition-colors hover:bg-pine/60 hover:text-mint"
    >
      <span className="flex w-12 shrink-0 justify-center">
        <Icon size={20} strokeWidth={1.75} aria-hidden />
      </span>
      <span className={labelClassName}>{label}</span>
    </button>
  );
}
