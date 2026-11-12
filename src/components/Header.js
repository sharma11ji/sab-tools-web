"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

export default function Header({ onMenu, onSearchOpen, query, setQuery }) {
  const { user } = useAuth();
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  // Search tab tak bada rehta hai jab tak focus ho ya usme kuch likha ho.
  const open = focused || query.length > 0;

  function openSearch() {
    setFocused(true);
    onSearchOpen?.();
    inputRef.current?.focus();
  }

  function closeSearch() {
    setQuery("");
    setFocused(false);
    inputRef.current?.blur();
  }

  // Button dabane se input ka focus na jaye, warna search bandh hokar dobara khul jata hai.
  const keepFocus = (e) => e.preventDefault();

  return (
    <header className="header">
      <button className="icon-btn" onClick={onMenu} aria-label="Menu">
        <span className="sidebar-icon" />
      </button>

      <div className="header-center">
        <Link href="/" className={`logo header-logo ${open ? "hidden" : ""}`}>
          SAB BOOK
        </Link>

        <div className={`search ${open ? "open" : ""}`}>
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setFocused(true);
              onSearchOpen?.();
            }}
            onBlur={() => setFocused(false)}
            placeholder="Search"
            aria-label="Search"
            tabIndex={open ? 0 : -1}
          />
          {open && (
            <button className="search-close" onMouseDown={keepFocus} onClick={closeSearch} aria-label="Close search">
              ×
            </button>
          )}
          <button
            className="search-btn"
            aria-label="Search"
            onMouseDown={keepFocus}
            onClick={() => (open ? inputRef.current?.focus() : openSearch())}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <line x1="15.5" y1="15.5" x2="21" y2="21" />
            </svg>
          </button>
        </div>
      </div>

      <Link href="/profile" className="round-btn" aria-label="Profile">
        {user?.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="avatar" src={user.photoURL} alt="Profile" referrerPolicy="no-referrer" />
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
            <circle cx="12" cy="8" r="4.5" />
            <path d="M3.5 21c0-5 3.8-7.5 8.5-7.5s8.5 2.5 8.5 7.5z" />
          </svg>
        )}
      </Link>
    </header>
  );
}
