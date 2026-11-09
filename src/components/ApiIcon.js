export default function ApiIcon({ size = 110 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <rect x="18" y="38" width="74" height="48" rx="8" fill="#ffc619" stroke="#000" strokeWidth="3" />
      <rect x="18" y="70" width="74" height="16" rx="6" fill="#b3b3b3" stroke="#000" strokeWidth="3" />
      <rect x="48" y="86" width="14" height="10" fill="#f59e0b" stroke="#000" strokeWidth="3" />
      <rect x="34" y="96" width="42" height="8" rx="3" fill="#b3b3b3" stroke="#000" strokeWidth="3" />
      <path d="M52 46 q0 -22 22 -22 q14 0 18 12 q12 2 12 14 q0 12 -12 12 H60 q-8 0 -8 -16z" fill="#7dd3fc" stroke="#000" strokeWidth="3" />
      <text x="82" y="52" textAnchor="middle" fontSize="20" fontWeight="800" fill="#000">API</text>
      <circle cx="30" cy="62" r="11" fill="#ef4444" stroke="#000" strokeWidth="3" />
      <circle cx="30" cy="62" r="4" fill="#fff" stroke="#000" strokeWidth="2" />
      <line x1="50" y1="62" x2="80" y2="62" stroke="#000" strokeWidth="3" />
    </svg>
  );
}
