"use client";
import { useCallback, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { ADMIN_EMAIL, isAdmin } from "@/lib/admin";
import { splitCategories } from "@/lib/books";

const EMPTY = {
  title: "",
  author: "",
  cover: "",
  pages: "",
  categories: "",
  readUrl: "",
  description: "",
  authorBio: "",
};

const isHttp = (s) => /^https?:\/\//i.test(s);

export default function AdminPage() {
  const { user, loading, login, logout } = useAuth();
  const [tab, setTab] = useState("books");
  const [books, setBooks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const admin = isAdmin(user);

  const load = useCallback(async () => {
    const [b, r] = await Promise.allSettled([
      getDocs(query(collection(db, "books"), orderBy("createdAt", "desc"))),
      getDocs(query(collection(db, "apiRequests"), orderBy("createdAt", "desc"))),
    ]);
    if (b.status === "fulfilled") {
      setBooks(b.value.docs.map((d) => ({ id: d.id, ...d.data() })));
    } else {
      console.error(b.reason);
      setMsg(`Books load nahi hui: ${b.reason?.code || b.reason?.message}. Firestore rules publish kiye hain?`);
    }
    if (r.status === "fulfilled") {
      setRequests(r.value.docs.map((d) => ({ id: d.id, ...d.data() })));
    } else {
      console.error(r.reason);
      setMsg(
        `Requests load nahi hui: ${r.reason?.code || r.reason?.message}. Firestore rules publish kiye hain?`
      );
    }
  }, []);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    const data = {
      title: form.title.trim(),
      author: form.author.trim(),
      cover: form.cover.trim(),
      pages: Math.max(0, Math.floor(Number(form.pages) || 0)),
      categories: splitCategories(form.categories),
      readUrl: form.readUrl.trim(),
      description: form.description.trim(),
      authorBio: form.authorBio.trim(),
    };
    if (data.cover && !isHttp(data.cover)) {
      setMsg("Cover ka link http:// ya https:// se shuru hona chahiye.");
      return;
    }
    if (data.readUrl && !isHttp(data.readUrl)) {
      setMsg("Padhne ka link http:// ya https:// se shuru hona chahiye.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      if (editId) {
        await updateDoc(doc(db, "books", editId), data);
        setMsg("Book update ho gayi.");
      } else {
        await addDoc(collection(db, "books"), { ...data, createdAt: serverTimestamp() });
        setMsg("Book add ho gayi. Home page par dikhegi.");
      }
      setForm(EMPTY);
      setEditId(null);
      await load();
    } catch (err) {
      console.error(err);
      setMsg(`Save nahi hua: ${err.code || err.message}. Firestore rules publish kiye hain?`);
    }
    setBusy(false);
  }

  function startEdit(b) {
    setForm({
      title: b.title || "",
      author: b.author || "",
      cover: b.cover || "",
      pages: b.pages ? String(b.pages) : "",
      categories: (b.categories || []).join(", "),
      readUrl: b.readUrl || "",
      description: b.description || "",
      authorBio: b.authorBio || "",
    });
    setEditId(b.id);
    setTab("books");
    setMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setForm(EMPTY);
    setEditId(null);
    setMsg("");
  }

  async function removeBook(b) {
    if (!window.confirm(`"${b.title}" ko delete karna hai?`)) return;
    try {
      await deleteDoc(doc(db, "books", b.id));
      if (editId === b.id) cancelEdit();
      await load();
    } catch (err) {
      console.error(err);
      setMsg(`Delete nahi hua: ${err.code || err.message}`);
    }
  }

  function useRequest(r) {
    setForm({ ...EMPTY, title: r.name || "", description: (r.details || "").slice(0, 300) });
    setEditId(null);
    setTab("books");
    setMsg("Request ki details form mein bhar di hain. Baaki fields bharke save karo.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeRequest(r) {
    if (!window.confirm(`"${r.name}" ki request hata deni hai?`)) return;
    try {
      await deleteDoc(doc(db, "apiRequests", r.id));
      await load();
    } catch (err) {
      console.error(err);
      setMsg(`Delete nahi hua: ${err.code || err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="page profile-box">
        <div className="skeleton" style={{ width: 200, height: 20 }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page profile-box">
        <h1>Admin</h1>
        <p>Admin panel ke liye sign in karo.</p>
        <button className="btn" onClick={() => login().catch(console.error)}>
          Sign in with Google
        </button>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="page profile-box">
        <h1>Access nahi hai</h1>
        <p>
          {user.email} admin nahi hai. Admin email se sign in karo ({ADMIN_EMAIL}).
        </p>
        <button className="btn ghost" onClick={logout}>Sign out</button>
      </div>
    );
  }

  return (
    <div className="page wide">
      <h1>Admin panel</h1>

      <div className="tabs">
        <button className={`tab ${tab === "books" ? "active" : ""}`} onClick={() => setTab("books")}>
          Books ({books.length})
        </button>
        <button className={`tab ${tab === "requests" ? "active" : ""}`} onClick={() => setTab("requests")}>
          Requests ({requests.length})
        </button>
      </div>

      {msg && <p className="msg admin-msg">{msg}</p>}

      {tab === "books" && (
        <>
          <form onSubmit={save} className="admin-form">
            <h2>{editId ? "Book badlo" : "Nayi book jodo"}</h2>
            <input className="field" required placeholder="Book ka naam" value={form.title} onChange={set("title")} />
            <input className="field" placeholder="Author ka naam" value={form.author} onChange={set("author")} />
            <input className="field" placeholder="Cover photo ka link (https://...)" value={form.cover} onChange={set("cover")} />
            <input className="field" inputMode="numeric" placeholder="Kitne pages" value={form.pages} onChange={set("pages")} />
            <input className="field" placeholder="Categories, comma se alag (jaise Story, Love, Motivation)" value={form.categories} onChange={set("categories")} />
            <input className="field" placeholder="Padhne ka link (https://... PDF ya page)" value={form.readUrl} onChange={set("readUrl")} />
            <textarea className="field" rows={5} placeholder="About this ebook (description)" value={form.description} onChange={set("description")} />
            <textarea className="field" rows={3} placeholder="Author ke baare mein" value={form.authorBio} onChange={set("authorBio")} />
            <div className="item-actions">
              <button className="btn" disabled={busy}>{busy ? "Ruko..." : editId ? "Update karo" : "Add karo"}</button>
              {editId && (
                <button type="button" className="btn ghost" onClick={cancelEdit}>Cancel</button>
              )}
            </div>
          </form>

          <div className="admin-list">
            {books.length === 0 && <p className="empty" style={{ padding: "24px 0" }}>Abhi koi book nahi hai.</p>}
            {books.map((b) => (
              <div className="list-item" key={b.id}>
                <div className="list-main">
                  <strong>{b.title}</strong>
                  {b.author && <span className="muted">{b.author}</span>}
                  {b.categories?.length > 0 && <span className="muted">{b.categories.join(", ")}</span>}
                </div>
                <div className="item-actions">
                  <button className="btn small ghost" onClick={() => startEdit(b)}>Edit</button>
                  <button className="btn small danger" onClick={() => removeBook(b)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "requests" && (
        <div className="admin-list">
          {requests.length === 0 && <p className="empty" style={{ padding: "24px 0" }}>Abhi koi request nahi aayi.</p>}
          {requests.map((r) => (
            <div className="list-item" key={r.id}>
              <div className="list-main">
                <strong>{r.name}</strong>
                {r.details && <span className="muted">{r.details}</span>}
                <span className="muted">{r.email}</span>
              </div>
              <div className="item-actions">
                <button className="btn small" onClick={() => useRequest(r)}>Book banao</button>
                <button className="btn small danger" onClick={() => removeRequest(r)}>Hata do</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn ghost" style={{ marginTop: 28 }} onClick={logout}>Sign out</button>
    </div>
  );
}
