import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";

export function cssVars(vars: Record<string, string>): CSSProperties {
  return vars as CSSProperties;
}

type ComicButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "orange-pink" | "orange-ink" | "yellow" | "yellow-cyan" | "ghost" | "paper" | "nav";
  external?: boolean;
  ariaLabel?: string;
};

const VARIANT: Record<NonNullable<ComicButtonProps["variant"]>, string> = {
  "orange-pink": "btn-orange shadow-pink",
  "orange-ink": "btn-orange shadow-ink",
  yellow: "btn-yellow",
  "yellow-cyan": "btn-yellow shadow-cyan",
  ghost: "btn-ghost",
  paper: "btn-paper",
  nav: "btn-orange btn-nav",
};

export function ComicButton({
  href,
  children,
  className = "",
  size = "md",
  variant = "orange-ink",
  external,
  ariaLabel,
}: ComicButtonProps) {
  const cls = `btn-comic btn-${size} ${VARIANT[variant]} ${className}`;
  const offsite = external ?? /^https?:\/\//.test(href);
  if (!offsite) {
    return (
      <Link className={cls} to={href} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }
  return (
    <a className={cls} href={href} aria-label={ariaLabel} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function DuckMark() {
  return (
    <span className="duck-mark" aria-hidden="true">
      <img className="closed" src="/brand/duck-head-mark.webp" alt="" />
      <img className="open" src="/brand/duck-head-mark-open.webp" alt="" />
    </span>
  );
}

export function Seam({ fill = "var(--paper)" }: { fill?: string }) {
  return (
    <div className="seam" aria-hidden="true">
      <span style={cssVars({ "--fill": fill })} />
    </div>
  );
}

export function ExtIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3z"
      />
    </svg>
  );
}

export function DiscordIcon() {
  return (
    <svg className="comic-icon" width="22" height="22" viewBox="0 0 127.14 96.36" aria-hidden="true">
      <path
        fill="currentColor"
        d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83A97.68 97.68 0 0 0 49 6.83 72.37 72.37 0 0 0 45.64 0 105.89 105.89 0 0 0 19.39 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.17-16.14C129.24 52.84 122.09 29.11 107.7 8.07ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53 48.84 65.69 42.45 65.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53 91.08 65.69 84.69 65.69Z"
      />
    </svg>
  );
}

export function GitHubIcon() {
  return (
    <svg className="comic-icon" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.28.73-.55v-1.84c-3.03.64-3.67-1.46-3.67-1.46-.55-1.29-1.28-1.65-1.28-1.65-.92-.65.1-.65.1-.65 1.1 0 1.73 1.1 1.73 1.1.92 1.65 2.57 1.2 3.21.92a2 2 0 01.64-1.47c-2.47-.27-5.04-1.19-5.04-5.5 0-1.1.46-2.1 1.2-2.84a3.76 3.76 0 010-2.93s.91-.28 3.11 1.1c1.8-.49 3.7-.49 5.5 0 2.1-1.38 3.02-1.1 3.02-1.1a3.76 3.76 0 010 2.93c.83.74 1.2 1.74 1.2 2.94 0 4.21-2.57 5.13-5.04 5.4.45.37.82.92.82 2.02v3.03c0 .27.1.64.73.55A11 11 0 0012 1.27"
      />
    </svg>
  );
}
