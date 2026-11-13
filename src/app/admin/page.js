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
  setDoc,
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
  readFile: "",
  readFileName: "",
  description: "",
  authorBio: "",
};

const isHttp = (s) => /^https?:\/\//i.test(s);
const isPhoto = (s) => s.startsWith("data:image/");

// Book ki file Firestore mein tukdon (chunks) mein jaati hai: bookFiles/{id} + bookFiles/{id}/chunks/0000...
// CHUNK 4 ka guna hona zaroori hai, taaki har tukda apne aap mein sahi base64 rahe.
const CHUNK = 700000; // akshar (~525 KB), Firestore ke 1 MB document limit se neeche
const MAX_MB = 5;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(new Error("File padh nahi paayi."));
    r.readAsDataURL(file);
  });
}

async function deleteFileDocs(fid) {
  const snap = await getDocs(collection(db, "bookFiles", fid, "chunks"));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db, "bookFiles", fid));
}

// Phone se chuni photo ko chhota (max 520px) karke JPEG text bana deta hai,
// taaki alag storage ke bina seedha book ke saath save ho jaye.
function photoToCover(file, maxSide = 520) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Ye photo khul nahi paayi."));
    };
    img.src = url;
  });
}

export default function AdminPage() {
  const { user, loading, login, logout } = useAuth();
  const [tab, setTab] = useState("books");
  const [books, setBooks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [upload, setUpload] = useState(null); // { name, pct } jab file upload ho rahi ho
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

  async function pickCover(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // wahi photo dobara chunni ho to bhi chale
    if (!file) return;
    try {
      const cover = await photoToCover(file);
      if (cover.length > 400000) {
        setMsg("Photo bahut bhari hai, koi doosri chuno.");
        return;
      }
      setForm((f) => ({ ...f, cover }));
      setMsg("");
    } catch (err) {
      setMsg(err.message);
    }
  }

  // Book ki file (kisi bhi format ki, 5 MB tak) tukdon mein Firestore par chadhao.
  async function pickBookFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setMsg(`File ${MAX_MB} MB se badi hai. Badi file ke liye Google Drive ka link use karo.`);
      return;
    }
    setMsg("");
    const fid = doc(collection(db, "bookFiles")).id;
    try {
      setUpload({ name: file.name, pct: 0 });
      const b64 = await fileToBase64(file);
      const chunks = Math.max(1, Math.ceil(b64.length / CHUNK));
      await setDoc(doc(db, "bookFiles", fid), {
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        chunks,
        createdAt: serverTimestamp(),
      });
      for (let n = 0; n < chunks; n++) {
        await setDoc(doc(db, "bookFiles", fid, "chunks", String(n).padStart(4, "0")), {
          n,
          data: b64.slice(n * CHUNK, (n + 1) * CHUNK),
        });
        setUpload({ name: file.name, pct: Math.round(((n + 1) / chunks) * 100) });
      }
      setForm((f) => ({ ...f, readFile: fid, readFileName: file.name }));
      setUpload(null);
      setMsg(`"${file.name}" upload ho gayi. Ab book Add/Update karo.`);
    } catch (err) {
      console.error(err);
      setUpload(null);
      await deleteFileDocs(fid).catch(() => {});
      setMsg(`File upload nahi hui: ${err.code || err.message}. Firestore rules publish kiye hain?`);
    }
  }

  async function save(e) {
    e.preventDefault();
    const data = {
      title: form.title.trim(),
      author: form.author.trim(),
      cover: form.cover.trim(),
      pages: Math.max(0, Math.floor(Number(form.pages) || 0)),
      categories: splitCategories(form.categories),
      readUrl: form.readUrl.trim(),
      readFile: form.readFile,
      readFileName: form.readFileName,
      description: form.description.trim(),
      authorBio: form.authorBio.trim(),
    };
    if (data.cover && !isHttp(data.cover) && !isPhoto(data.cover)) {
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
      readFile: b.readFile || "",
      readFileName: b.readFileName || "",
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
      if (b.readFile) await deleteFileDocs(b.readFile).catch(console.error);
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
            {isPhoto(form.cover) ? (
              <div className="cover-pick">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.cover} alt="Chuni hui cover photo" />
                <button type="button" className="btn small ghost" onClick={() => setForm((f) => ({ ...f, cover: "" }))}>
                  Photo hatao
                </button>
              </div>
            ) : (
              <>
                <input className="field" placeholder="Cover photo ka link (https://...)" value={form.cover} onChange={set("cover")} />
                <label className="btn small ghost file-btn">
                  Ya phone se photo chuno
                  <input type="file" accept="image/*" hidden onChange={pickCover} />
                </label>
              </>
            )}
            <input className="field" inputMode="numeric" placeholder="Kitne pages" value={form.pages} onChange={set("pages")} />
            <input className="field" placeholder="Categories, comma se alag (jaise Story, Love, Motivation)" value={form.categories} onChange={set("categories")} />
            <input className="field" placeholder="Padhne ka link (Google Drive ya koi https:// link), ya neeche se chhoti file chuno" value={form.readUrl} onChange={set("readUrl")} />
            {form.readFile ? (
              <div className="cover-pick">
                <span className="muted-note">{form.readFileName || "File"} jodi gayi hai (READ NOW isi ko kholega)</span>
                <button type="button" className="btn small ghost" onClick={() => setForm((f) => ({ ...f, readFile: "", readFileName: "" }))}>
                  File hatao
                </button>
              </div>
            ) : (
              <>
                <label className="btn small ghost file-btn">
                  {upload ? `Upload ho rahi hai... ${upload.pct}%` : `Ya book ki file chuno (${MAX_MB} MB tak, kisi bhi format mein)`}
                  <input type="file" hidden disabled={!!upload} onChange={pickBookFile} />
                </label>
                {upload && <p className="muted-note" style={{ marginBottom: 12 }}>{upload.name}</p>}
              </>
            )}
            <textarea className="field" rows={5} placeholder="About this ebook (description)" value={form.description} onChange={set("description")} />
            <textarea className="field" rows={3} placeholder="Author ke baare mein" value={form.authorBio} onChange={set("authorBio")} />
            <div className="item-actions">
              <button className="btn" disabled={busy || !!upload}>{busy ? "Ruko..." : editId ? "Update karo" : "Add karo"}</button>
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
