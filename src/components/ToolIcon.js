// Jis tool ka apna icon nahi hota, uske liye naam ka pehla akshar dikhta hai.
export default function ToolIcon({ name = "", size = 110 }) {
  const letter = (name.trim()[0] || "?").toUpperCase();
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <rect x="12" y="12" width="96" height="96" rx="16" fill="#ffc619" stroke="#000" strokeWidth="3" />
      <text x="60" y="80" textAnchor="middle" fontSize="56" fontWeight="800" fill="#000">
        {letter}
      </text>
    </svg>
  );
}
