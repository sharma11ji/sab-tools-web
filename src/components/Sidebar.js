"use client";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { isAdmin } from "@/lib/admin";

// Yahan apne asli options daal dena
const OPTIONS = [
  { label: "All APIs", href: "/" },
  { label: "Request API", href: "/request" },
  { label: "Profile", href: "/profile" },
  { label: "Chat", href: "/chat" },
  { label: "Option", href: "/" },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  // Admin link sirf admin ko dikhta hai
  const items = isAdmin(user) ? [...OPTIONS, { label: "Admin", href: "/admin" }] : OPTIONS;

  return (
    <>
      {open && <div className="overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="sidebar-head">
          <div className="title">
            <div className="logo">SAB TOOLS</div>
            <h2>Options</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close menu">
            <span className="sidebar-icon" />
          </button>
        </div>

        <nav>
          {items.map((o, i) => (
            <Link key={i} href={o.href} className="option" onClick={onClose}>
              {o.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
