"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { openDm, saveProfile } from "@/lib/chat";
import ChatAvatar from "@/components/ChatAvatar";

export default function ChatListPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [profiles, setProfiles] = useState({}); // uid -> {name, photoURL}
  const [mode, setMode] = useState("list"); // list | people | group
  const [people, setPeople] = useState([]);
  const [q, setQ] = useState("");
  const [groupName, setGroupName] = useState("");
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const fail = (what) => (e) => {
    console.error(e);
    setErr(`${what}: ${e?.code || e?.message}. Firestore rules publish kiye hain?`);
    setBusy(false);
  };

  // Apni profile save karo, taaki dusre mujhe dhoondh sakein
  useEffect(() => {
    if (user) saveProfile(user).catch(fail("Profile save nahi hui"));
  }, [user]);

  // Meri chats (live)
  useEffect(() => {
    if (!user) return;
    const qy = query(collection(db, "chats"), where("members", "array-contains", user.uid));
    return onSnapshot(
      qy,
      (snap) => setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      fail("Chats load nahi hui")
    );
  }, [user]);

  // 1-to-1 chats ke liye samne wale ka naam laao
  useEffect(() => {
    if (!user) return;
    const need = chats
      .filter((c) => c.type === "dm")
      .map((c) => c.members.find((m) => m !== user.uid))
      .filter((uid) => uid && !profiles[uid]);
    need.forEach(async (uid) => {
      try {
        const s = await getDoc(doc(db, "users", uid));
        setProfiles((p) => ({ ...p, [uid]: s.exists() ? s.data() : { name: "User", photoURL: "" } }));
      } catch (e) {
        console.error(e);
      }
    });
  }, [chats, user, profiles]);

  // Log dhoondhne ki list: tab hi laao jab "naya chat" ya "naya group" khule
  useEffect(() => {
    if (!user || mode === "list") return;
    getDocs(query(collection(db, "users"), limit(100)))
      .then((s) => setPeople(s.docs.map((d) => d.data()).filter((p) => p.uid !== user.uid)))
      .catch(fail("Log load nahi hue"));
  }, [mode, user]);

  function nameOf(c) {
    if (c.type === "group") return c.name;
    const other = c.members.find((m) => m !== user.uid);
    return profiles[other]?.name || "...";
  }
  function photoOf(c) {
    if (c.type === "group") return "";
    const other = c.members.find((m) => m !== user.uid);
    return profiles[other]?.photoURL || "";
  }

  async function startDm(p) {
    setBusy(true);
    setErr("");
    try {
      const id = await openDm(user.uid, p.uid);
      router.push(`/chat/${id}`);
    } catch (e) {
      fail("Chat nahi khuli")(e);
    }
  }

  async function makeGroup(e) {
    e.preventDefault();
    const name = groupName.trim();
    if (!name || picked.length === 0) return;
    setBusy(true);
    setErr("");
    try {
      const ref = await addDoc(collection(db, "chats"), {
        type: "group",
        name: name.slice(0, 50),
        members: [user.uid, ...picked],
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      router.push(`/chat/${ref.id}`);
    } catch (e2) {
      fail("Group nahi bana")(e2);
    }
  }

  const togglePick = (uid) =>
    setPicked((s) => (s.includes(uid) ? s.filter((x) => x !== uid) : [...s, uid]));

  if (loading) {
    return (
      <div className="chat-page">
        <div className="skeleton" style={{ height: 56, marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 56, marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 56 }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page profile-box">
        <h1>SAB Chat</h1>
        <p>Chat karne ke liye Google se sign in karo.</p>
        <button className="btn" onClick={() => login().catch(console.error)}>
          Sign in with Google
        </button>
      </div>
    );
  }

  const shown = people.filter((p) => p.name?.toLowerCase().includes(q.trim().toLowerCase()));
  const sorted = [...chats].sort((a, b) => nameOf(a).localeCompare(nameOf(b)));

  return (
    <div className="chat-page">
      <h1>SAB Chat</h1>
      {err && <p className="msg admin-msg">{err}</p>}

      {mode === "list" && (
        <>
          <div className="chat-actions">
            <button className="btn" onClick={() => { setMode("people"); setQ(""); }}>Naya chat</button>
            <button className="btn ghost" onClick={() => { setMode("group"); setQ(""); setPicked([]); setGroupName(""); }}>Naya group</button>
          </div>

          <Link href="/chat/public" className="chat-item">
            <span className="chat-avatar">#</span>
            <span className="chat-item-main">
              <strong>Public Room</strong>
              <span className="muted">Yahan sab log baat karte hain</span>
            </span>
          </Link>

          {sorted.map((c) => (
            <Link key={c.id} href={`/chat/${c.id}`} className="chat-item">
              <ChatAvatar name={nameOf(c)} photoURL={photoOf(c)} />
              <span className="chat-item-main">
                <strong>{nameOf(c)}</strong>
                <span className="muted">{c.type === "group" ? `Group · ${c.members.length} log` : "1-to-1 chat"}</span>
              </span>
            </Link>
          ))}
          {sorted.length === 0 && (
            <p className="empty" style={{ padding: "24px 0" }}>
              Abhi koi private chat nahi. &quot;Naya chat&quot; dabao aur kisi se baat shuru karo.
            </p>
          )}
        </>
      )}

      {mode !== "list" && (
        <>
          <button className="btn ghost small" style={{ marginBottom: 14 }} onClick={() => setMode("list")}>
            ← Wapas
          </button>

          {mode === "group" && (
            <input
              className="field"
              placeholder="Group ka naam"
              maxLength={50}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          )}
          <input
            className="field"
            placeholder="Naam se dhoondho"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          {shown.map((p) => (
            <button
              key={p.uid}
              className="chat-item chat-pick"
              disabled={busy}
              onClick={() => (mode === "people" ? startDm(p) : togglePick(p.uid))}
            >
              <ChatAvatar name={p.name} photoURL={p.photoURL} />
              <span className="chat-item-main"><strong>{p.name}</strong></span>
              {mode === "group" && (
                <span className={`chat-check ${picked.includes(p.uid) ? "on" : ""}`}>
                  {picked.includes(p.uid) ? "✓" : ""}
                </span>
              )}
            </button>
          ))}
          {shown.length === 0 && (
            <p className="empty" style={{ padding: "24px 0" }}>
              Koi nahi mila. Doston se kaho ki ek baar SAB Chat kholkar sign in karein, tab wo yahan dikhenge.
            </p>
          )}

          {mode === "group" && (
            <form onSubmit={makeGroup}>
              <button
                className="btn"
                style={{ width: "100%", marginTop: 8 }}
                disabled={busy || !groupName.trim() || picked.length === 0}
              >
                {busy ? "Ruko..." : `Group banao (${picked.length + 1} log)`}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
