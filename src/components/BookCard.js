import Link from "next/link";

// Cover na ho to white dabbe mein title dikhta hai (wireframe ka "book photo").
export default function BookCard({ book }) {
  return (
    <Link className="book-card" href={`/book/${book.id}`}>
      <div className="book-cover">
        {book.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.cover} alt={book.title} loading="lazy" />
        ) : (
          <span className="book-cover-empty">{book.title}</span>
        )}
      </div>
      <strong className="book-title">{book.title}</strong>
      {book.author && <span className="book-author">{book.author}</span>}
    </Link>
  );
}
