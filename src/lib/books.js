// Books ka chhota helper code. Firestore: books/{id} aur books/{id}/reviews/{uid}.
// Book: { title, author, cover, pages, description, categories[], readUrl, authorBio, createdAt }
// Review: { uid, name, photoURL, rating 1-5, text, createdAt }

export const NO_CATEGORY = "Aur books";

// "love, story ,  " -> ["love", "story"]
export function splitCategories(text) {
  return String(text || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

// Ek book kai category mein ho sakti hai. Category ke hisaab se shelves banate hain.
export function groupByCategory(books) {
  const map = new Map();
  for (const b of books) {
    const cats = Array.isArray(b.categories) && b.categories.length ? b.categories : [NO_CATEGORY];
    for (const c of cats) {
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(b);
    }
  }
  return [...map.entries()].map(([name, list]) => ({ name, books: list }));
}

export function matchesSearch(book, q) {
  const hay = [book.title, book.author, ...(book.categories || [])].join(" ").toLowerCase();
  return hay.includes(q);
}

export function averageRating(reviews) {
  if (!reviews.length) return 0;
  return reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length;
}

export function reviewerName(user) {
  if (user.displayName) return user.displayName.slice(0, 60);
  return (user.email || "User").split("@")[0].slice(0, 60);
}
