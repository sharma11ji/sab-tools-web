"use client";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

export default function Header({ onMenu, query, setQuery }) {
  const { user } = useAuth();

  return (
    <header className="header">
      <button className="icon-btn" onClick={onMenu} aria-label="Menu">
        <span className="sidebar-icon" />
      </button>

      <Link href="/" className="logo">SAB TOOLS</Link>

      <label className="search">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search APIs..."
          aria-label="Search"
        />
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="22" y2="22" />
        </svg>
      </label>

      <Link href="/profile" className="icon-btn" aria-label="Profile">
        {user?.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="avatar" src={user.photoURL} alt="Profile" referrerPolicy="no-referrer" />
        ) : (
          <svg className="user-icon" viewBox="0 0 24 24" fill="#000">
            <circle cx="12" cy="7" r="5" />
            <path d="M2 22c0-6 4.5-9 10-9s10 3 10 9z" />
          </svg>
        )}
      </Link>
    </header>
  );
}
