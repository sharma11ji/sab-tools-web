"use client";
import { useRef } from "react";
import BookCard from "./BookCard";
import { ChevronIcon } from "./BookIcons";

// Ek category ki shelf: 3 books dikhti hain, kaala gol button dabane par aage scroll hota hai.
export default function BookRow({ title, books }) {
  const ref = useRef(null);

  function next() {
    const el = ref.current;
    if (!el) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else el.scrollBy({ left: el.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <section className="shelf">
      <h2 className="shelf-title">{title}</h2>
      <div className="shelf-wrap">
        <div className="shelf-row" ref={ref}>
          {books.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
        {books.length > 3 && (
          <button className="shelf-next" onClick={next} aria-label={`${title} mein aage dekho`}>
            <ChevronIcon dir="right" />
          </button>
        )}
      </div>
    </section>
  );
}
