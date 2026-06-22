import type { ReactNode } from "react";
import { WindowGlyph } from "./WindowGlyph";

export function Panel({
  title,
  label,
  children,
  className = "",
  bodyClassName = "p-5",
}: {
  title: string;
  label?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`window ${className}`}>
      <div className="window__bar">
        <span className="flex items-center gap-2 text-ink">
          <WindowGlyph />
          {title}
        </span>
        {label ? <span className="text-muted">{label}</span> : null}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
