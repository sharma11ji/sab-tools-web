"use client";
import Link from "next/link";

// Yahan apne asli options daal dena
const OPTIONS = [
  { label: "All APIs", href: "/" },
  { label: "Request API", href: "/request" },
  { label: "Profile", href: "/profile" },
  { label: "Option", href: "/" },
  { label: "Option", href: "/" },
  { label: "Option", href: "/" },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="title">
          <div className="logo">SAB TOOLS</div>
          <h2>Options</h2>
        </div>
        {OPTIONS.map((o, i) => (
          <Link key={i} href={o.href} className="option" onClick={onClose}>
            <span className="dot" />
            <span className="pill">{o.label}</span>
          </Link>
        ))}
      </aside>
    </>
  );
}
