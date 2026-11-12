"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { isAdmin } from "@/lib/admin";
import { averageRating, reviewerName } from "@/lib/books";
import { EbookIcon, PagesIcon, PlayIcon, RatingIcon, ReviewIcon } from "@/components/BookIcons";

// Bhare/khaali taare. Sirf rang par nahi, ★ aur ☆ ke shape se bhi farak dikhta hai.
function Stars({ value }) {
  const n = Math.round(value);
  return (
    <span className="stars" role="img" aria-label={`5 mein se ${n} taare`}>
      {"★".repeat(n)}
      {"☆".repeat(5 - n)}
    </span>
  );
}

export default function BookPage() {
  const { id } = useParams();
  const { user, login } = useAuth();
  const [book, setBook] = useState(null); // null = loading, false = nahi mili
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "books", id, "reviews"), orderBy("createdAt", "desc"), limit(100))
      );
      setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
      setMsg("Reviews load nahi hue. Firestore rules publish kiye hain?");
    }
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "books", id));
        setBook(snap.exists() ? { id: snap.id, ...snap.data() } : false);
      } catch (e) {
        console.error(e);
        setBook(false);
      }
    })();
    loadReviews();
  }, [id, loadReviews]);

  // Apna purana review ho to form mein bhar do
  const mine = user ? reviews.find((r) => r.uid === user.uid) : null;
  useEffect(() => {
    if (mine) {
      setRating(mine.rating || 0);
      setText(mine.text || "");
    }
  }, [mine?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submitReview(e) {
    e.preventDefault();
    if (rating < 1) {
      setMsg("Pehle taare chuno (1 se 5).");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await setDoc(doc(db, "books", id, "reviews", user.uid), {
        uid: user.uid,
        name: reviewerName(user),
        photoURL: user.photoURL || "",
        rating,
        text: text.trim().slice(0, 500),
        createdAt: serverTimestamp(),
      });
      setMsg("Review save ho gaya.");
      await loadReviews();
    } catch (err) {
      console.error(err);
      setMsg(`Review save nahi hua: ${err.code || err.message}`);
    }
    setBusy(false);
  }

  async function removeReview(r) {
    if (!window.confirm("Ye review hata dena hai?")) return;
    try {
      await deleteDoc(doc(db, "books", id, "reviews", r.id));
      if (user && r.uid === user.uid) {
        setRating(0);
        setText("");
      }
      await loadReviews();
    } catch (err) {
      console.error(err);
      setMsg(`Delete nahi hua: ${err.code || err.message}`);
    }
  }

  if (book === null) {
    return (
      <div className="page book-page">
        <div className="book-top">
          <div className="skeleton sk-cover" />
          <div className="skeleton sk-line" style={{ width: 140, height: 24 }} />
        </div>
      </div>
    );
  }

  if (book === false) {
    return <p className="empty">Ye book nahi mili.</p>;
  }

  const avg = averageRating(reviews);
  const cats = Array.isArray(book.categories) ? book.categories : [];

  return (
    <div className="page book-page">
      <div className="book-top">
        <div className="book-cover big">
          {book.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.cover} alt={book.title} />
          ) : (
            <span className="book-cover-empty">{book.title}</span>
          )}
        </div>
        <div className="book-head">
          <h1>{book.title}</h1>
          {book.author && <p className="book-head-author">{book.author}</p>}
        </div>
      </div>

      <div className="stats" role="list">
        <div className="stat" role="listitem">
          <RatingIcon />
          <strong>{reviews.length ? avg.toFixed(1) : "–"}</strong>
          <span>Rating</span>
        </div>
        <div className="stat" role="listitem">
          <EbookIcon />
          <strong>E-Book</strong>
          <span>Format</span>
        </div>
        <div className="stat" role="listitem">
          <PagesIcon />
          <strong>{book.pages || "–"}</strong>
          <span>Pages</span>
        </div>
        <div className="stat" role="listitem">
          <ReviewIcon />
          <strong>{reviews.length}</strong>
          <span>Reviews</span>
        </div>
      </div>

      {book.readUrl && (
        <a className="read-btn" href={book.readUrl} target="_blank" rel="noreferrer">
          <PlayIcon />
          <span>READ NOW</span>
        </a>
      )}

      <h2 className="sec-title">About this ebook</h2>
      <p className="book-desc">{book.description || "Description abhi nahi daali gayi."}</p>

      {cats.length > 0 && (
        <div className="pills">
          {cats.map((c) => (
            <span className="pill" key={c}>{c}</span>
          ))}
        </div>
      )}

      <h2 className="sec-title">Rating and reviews</h2>
      <div className="rating-badge">
        <span className="rating-num">{reviews.length ? avg.toFixed(1) : "0.0"}</span>
        <Stars value={avg} />
      </div>

      {msg && <p className="msg">{msg}</p>}

      <div className="review-row">
        {reviews.length === 0 && <p className="muted-note">Abhi koi review nahi. Pehla review tum likho.</p>}
        {reviews.map((r) => (
          <div className="review-box" key={r.id}>
            <div className="review-head">
              <strong>{r.name}</strong>
              <Stars value={r.rating || 0} />
            </div>
            <p>{r.text || "(sirf rating di hai)"}</p>
            {user && (r.uid === user.uid || isAdmin(user)) && (
              <button className="link-btn" onClick={() => removeReview(r)}>Hata do</button>
            )}
          </div>
        ))}
      </div>

      {user ? (
        <form className="review-form" onSubmit={submitReview}>
          <h3>{mine ? "Apna review badlo" : "Review likho"}</h3>
          <div className="star-pick" role="radiogroup" aria-label="Rating chuno">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} taare`}
                className={`star-btn ${n <= rating ? "on" : ""}`}
                onClick={() => setRating(n)}
              >
                {n <= rating ? "★" : "☆"}
              </button>
            ))}
          </div>
          <textarea className="field" rows={3} maxLength={500} placeholder="Book kaisi lagi? (optional)" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn" disabled={busy}>{busy ? "Ruko..." : mine ? "Update karo" : "Review bhejo"}</button>
        </form>
      ) : (
        <button className="btn ghost" onClick={() => login().catch(console.error)}>Review ke liye sign in karo</button>
      )}

      <h2 className="sec-title">About {book.author || "the author"}</h2>
      <p className="book-desc">{book.authorBio || "Author ke baare mein abhi kuch nahi likha."}</p>
    </div>
  );
}
