import React from "react";

export function HighlightText({
  text,
  highlight,
}: {
  text: string | null | undefined;
  highlight?: string | null;
}) {
  if (!text) return null;
  if (!highlight) return <>{text}</>;

  const parts = text.split(new RegExp(`(${highlight})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span
            key={i}
            className="bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-100 rounded px-0.5"
          >
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}
