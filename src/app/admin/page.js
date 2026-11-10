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

const EMPTY = { name: "", description: "", url: "", icon: "" };

export default function AdminPage() {
  const { user, loading, login, logout } = useAuth();
  const [tab, setTab] = useState("tools");
  const [tools, setTools] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const admin = isAdmin(user);

  const load = useCallback(async () => {
    const [t, r] = await Promise.allSettled([
      getDocs(query(collection(db, "apis"), orderBy("createdAt", "desc"))),
      getDocs(query(collection(db, "apiRequests"), orderBy("createdAt", "desc"))),
    ]);
    if (t.status === "fulfilled") {
      setTools(t.value.docs.map((d) => ({ id: d.id, ...d.data() })));
    } else {
      console.error(t.reason);
      setMsg(`Tools load nahi hue: ${t.reason?.code || t.reason?.message}`);
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
      name: form.name.trim(),
      description: form.description.trim(),
      url: form.url.trim(),
      icon: form.icon.trim(),
    };
    if (!data.url.startsWith("/") && !/^https?:\/\//i.test(data.url)) {
      setMsg("URL http:// ya https:// se shuru hona chahiye (ya / se, site ke andar ke tool ke liye).");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      if (editId) {
        await updateDoc(doc(db, "apis", editId), data);
        setMsg("Tool update ho gaya.");
      } else {
        await addDoc(collection(db, "apis"), { ...data, createdAt: serverTimestamp() });
        setMsg("Tool add ho gaya. Home page par dikhega.");
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

  function startEdit(t) {
    setForm({
      name: t.name || "",
      description: t.description || "",
      url: t.url || "",
      icon: t.icon || "",
    });
    setEditId(t.id);
    setTab("tools");
    setMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setForm(EMPTY);
    setEditId(null);
    setMsg("");
  }

  async function removeTool(t) {
    if (!window.confirm(`"${t.name}" ko delete karna hai?`)) return;
    try {
      await deleteDoc(doc(db, "apis", t.id));
      if (editId === t.id) cancelEdit();
      await load();
    } catch (err) {
      console.error(err);
      setMsg(`Delete nahi hua: ${err.code || err.message}`);
    }
  }

  function useRequest(r) {
    setForm({ name: r.name || "", description: (r.details || "").slice(0, 140), url: "", icon: "" });
    setEditId(null);
    setTab("tools");
    setMsg("Request ki details form mein bhar di hain. URL daalkar save karo.");
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
        <button className={`tab ${tab === "tools" ? "active" : ""}`} onClick={() => setTab("tools")}>
          Tools ({tools.length})
        </button>
        <button className={`tab ${tab === "requests" ? "active" : ""}`} onClick={() => setTab("requests")}>
          Requests ({requests.length})
        </button>
      </div>

      {msg && <p className="msg admin-msg">{msg}</p>}

      {tab === "tools" && (
        <>
          <form onSubmit={save} className="admin-form">
            <h2>{editId ? "Tool badlo" : "Naya tool jodo"}</h2>
            <input className="field" required placeholder="Naam (jaise Weather API)" value={form.name} onChange={set("name")} />
            <input className="field" placeholder="Chhota description" value={form.description} onChange={set("description")} />
            <input className="field" required placeholder="Link (https://... ya /tools/...)" value={form.url} onChange={set("url")} />
            <input className="field" placeholder="Icon ka link (https://... ya /icons/weather.svg), khaali chhodo to pehla akshar dikhega" value={form.icon} onChange={set("icon")} />
            <div className="item-actions">
              <button className="btn" disabled={busy}>{busy ? "Ruko..." : editId ? "Update karo" : "Add karo"}</button>
              {editId && (
                <button type="button" className="btn ghost" onClick={cancelEdit}>Cancel</button>
              )}
            </div>
          </form>

          <div className="admin-list">
            {tools.length === 0 && <p className="empty" style={{ padding: "24px 0" }}>Abhi koi tool nahi hai.</p>}
            {tools.map((t) => (
              <div className="list-item" key={t.id}>
                <div className="list-main">
                  <strong>{t.name}</strong>
                  {t.description && <span className="muted">{t.description}</span>}
                  <span className="muted link">{t.url}</span>
                </div>
                <div className="item-actions">
                  <button className="btn small ghost" onClick={() => startEdit(t)}>Edit</button>
                  <button className="btn small danger" onClick={() => removeTool(t)}>Delete</button>
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
                <button className="btn small" onClick={() => useRequest(r)}>Tool banao</button>
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
