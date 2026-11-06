"use client";
import { useMemo, useState } from "react";
import s from "./InviteShell.module.css";
import { LangProvider, LangSwitch } from "./i18n";
import { cx } from "./shared";

/**
 * Wraps an invitation page and provides the brand tokens every section reads.
 * theme: optional CSS-variable overrides, e.g. { "--inv-accent": "#b8860b" }
 * locked: stops page scroll (used while the intro is showing).
 * languages: show the English / हिन्दी / मराठी / ગુજરાતી switch.
 */
export default function InviteShell({ theme, locked = false, languages = false, className, children }) {
  const [lang, setLang] = useState("en");
  const value = useMemo(() => ({ lang, setLang }), [lang]);
  return <LangProvider value={value}>
    <div className={cx(s.shell, locked && s.locked, className)} style={theme} lang={lang}>
      {children}
      {languages && <LangSwitch />}
    </div>
  </LangProvider>;
}
