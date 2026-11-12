"use client";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { groupByCategory, matchesSearch } from "@/lib/books";
import { useShell } from "@/components/Shell";
import BookCard from "@/components/BookCard";
import BookRow from "@/components/BookRow";
import { ChevronIcon } from "@/components/BookIcons";

const STEP = 2; // shuru mein 2 category, neeche ka chevron 2-2 aur kholta hai

function SkeletonShelves() {
  return (
    <div className="shelves" aria-busy="true" aria-label="Loading">
      {[0, 1].map((i) => (
        <div className="shelf" key={i}>
          <div className="skeleton sk-title" />
          <div className="shelf-row">
            {[0, 1, 2].map((j) => (
              <div className="skeleton sk-book" key={j} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [books, setBooks] = useState(null); // null = loading
  const [error, setError] = useState("");
  const [shown, setShown] = useState(STEP);
  const { query: search } = useShell();

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "books"), orderBy("createdAt", "desc")));
        setBooks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
        setError("Books load nahi ho paayi. Firestore rules check karo.");
        setBooks([]);
      }
    })();
  }, []);

  const q = search.trim().toLowerCase();
  const groups = useMemo(() => groupByCategory(books || []), [books]);

  if (books === null) return <SkeletonShelves />;

  if (q) {
    const found = books.filter((b) => matchesSearch(b, q));
    if (!found.length) return <p className="empty">Koi book nahi mili.</p>;
    return (
      <main className="shelves">
        <div className="book-grid">
          {found.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      </main>
    );
  }

  if (!books.length) {
    return <p className="empty">{error || "Abhi koi book nahi hai. Admin panel se pehli book jodo."}</p>;
  }

  return (
    <main className="shelves">
      {error && <p className="empty" style={{ padding: "0 0 12px" }}>{error}</p>}
      {groups.slice(0, shown).map((g) => (
        <BookRow key={g.name} title={g.name} books={g.books} />
      ))}
      {shown < groups.length && (
        <button className="more-btn" onClick={() => setShown((n) => n + STEP)} aria-label="Aur categories dikhao">
          <ChevronIcon dir="down" />
        </button>
      )}
    </main>
  );
}
