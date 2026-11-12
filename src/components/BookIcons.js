// Book page ke chhote icons (sab black line wale, wireframe jaisa).
const base = { width: 34, height: 34, viewBox: "0 0 48 48", fill: "none", stroke: "#000", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

export function RatingIcon() {
  return (
    <svg {...base}>
      <path d="M30 6l3.6 7.4 8.1 1.2-5.9 5.7 1.4 8.1L30 24.6l-7.2 3.8 1.4-8.1-5.9-5.7 8.1-1.2z" />
      <path d="M6 34l8-7 8 3c2 1 2 3 0 3.5H16M6 34l5 8M16 33.5l9-.5 8-4" />
    </svg>
  );
}

export function EbookIcon() {
  return (
    <svg {...base}>
      <rect x="9" y="8" width="30" height="32" rx="3" />
      <path d="M14 14h20M14 20h20" />
      <rect x="14" y="26" width="20" height="8" rx="1.5" />
    </svg>
  );
}

export function PagesIcon() {
  return (
    <svg {...base}>
      <rect x="12" y="5" width="24" height="38" rx="3" />
      <path d="M17 12h14M17 17h14M17 22h14M17 27h9" />
      <circle cx="24" cy="37" r="1.4" />
    </svg>
  );
}

export function ReviewIcon() {
  return (
    <svg {...base}>
      <path d="M8 10h32v22H22l-8 7v-7H8z" />
      <path d="M15 18h18M15 24h12" />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="13" cy="13" r="13" fill="#fff" />
      <path d="M10 7.5l9 5.5-9 5.5z" fill="#000" />
    </svg>
  );
}

export function ChevronIcon({ dir = "right" }) {
  const rot = { right: 0, down: 90, left: 180 }[dir];
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${rot}deg)` }} aria-hidden="true">
      <path d="M7 3l7 7-7 7" />
    </svg>
  );
}
