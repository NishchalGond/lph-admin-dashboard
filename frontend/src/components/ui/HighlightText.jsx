import React from 'react';

/**
 * Highlights all token matches of a multi-word query within text.
 * Splits the query on whitespace and highlights each token independently.
 * Renders matching segments with a subtle amber/gold glow background.
 */
const HighlightText = ({ text, highlight }) => {
  if (!text) return <span>—</span>;
  const str = String(text);
  if (!highlight || !highlight.trim()) return <span>{str}</span>;

  // Build a combined regex from all tokens
  const tokens = highlight
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (tokens.length === 0) return <span>{str}</span>;

  const pattern = new RegExp(`(${tokens.join('|')})`, 'gi');
  const parts = str.split(pattern);

  return (
    <span>
      {parts.map((part, index) =>
        tokens.some((t) => part.toLowerCase() === t.toLowerCase()) ? (
          <mark
            key={index}
            className="bg-amber-400/30 dark:bg-amber-400/35 text-amber-900 dark:text-amber-200 font-bold px-0.5 rounded-sm"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
    </span>
  );
};

export default HighlightText;
