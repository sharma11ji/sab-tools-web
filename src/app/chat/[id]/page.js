"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { PUBLIC_ID, displayNameOf, fmtDay, fmtTime, sameDay } from "@/lib/chat";
import ChatAvatar from "@/components/ChatAvatar";

export default function ChatRoomPage() {
  const { id } = useParams();
  const { user, loading, login } = useAuth();
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("loading"); // loading | ok | denied
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const listRef = useRef(null);

  // Chat ka naam aur access check
  useEffect(() => {
    if (!user || !id) return;
    let cancelled = false;
    (async () => {
      if (id === PUBLIC_ID) {
        setTitle("Public Room");
        setStatus("ok");
        return;
      }
      try {
        const s = await getDoc(doc(db, "chats", id));
        if (cancelled) return;
        if (!s.exists()) return setStatus("denied");
        const c = s.data();
        if (c.type === "group") {
          setTitle(c.name);
        } else {
          const other = c.members.find((m) => m !== user.uid);
          const u = await getDoc(doc(db, "users", other));
          if (cancelled) return;
          setTitle(u.exists() ? u.data().name : "Chat");
        }
        setStatus("ok");
      } catch (e) {
        console.error(e);
        if (!cancelled) setStatus("denied");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, id]);

  // Messages (live): sabse naye 100
  useEffect(() => {
    if (status !== "ok") return;
    const qy = query(collection(db, "chats", id, "messages"), orderBy("createdAt", "desc"), limit(100));
    return onSnapshot(
      qy,
      (snap) => {
        setErr("");
        setMsgs(
          snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) })).reverse()
        );
      },
      (e) => {
        console.error(e);
        setErr(`Messages load nahi hue: ${e?.code || e?.message}`);
      }
    );
  }, [status, id]);

  // Naya message aane par neeche tak scroll
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  async function send(e) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText("");
    setErr("");
    try {
      await addDoc(collection(db, "chats", id, "messages"), {
        text: t.slice(0, 2000),
        uid: user.uid,
        name: displayNameOf(user),
        photoURL: user.photoURL || "",
        createdAt: serverTimestamp(),
      });
    } catch (e2) {
      console.error(e2);
      setErr(`Message nahi gaya: ${e2?.code || e2?.message}. Firestore rules publish kiye hain?`);
      setText(t);
    }
  }

  if (loading) {
    return (
      <div className="chat-page">
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

  if (status === "denied") {
    return (
      <div className="page profile-box">
        <h1>Chat nahi mili</h1>
        <p>Ya to ye chat hai hi nahi, ya tum is chat ke member nahi ho.</p>
        <Link href="/chat" className="btn">Chats par jao</Link>
      </div>
    );
  }

  return (
    <div className="chat-room">
      <div className="chat-top">
        <Link href="/chat" className="chat-back" aria-label="Wapas">←</Link>
        <div className="chat-title">{title || "..."}</div>
      </div>

      <div className="chat-msgs" ref={listRef}>
        {id === PUBLIC_ID && (
          <p className="chat-note">Public Room mein har sign in kiya hua banda tumhare message dekh sakta hai.</p>
        )}
        {status === "ok" && msgs.length === 0 && !err && (
          <p className="empty" style={{ padding: "30px 0" }}>Abhi koi message nahi. Pehla message bhejo!</p>
        )}
        {msgs.map((m, i) => {
          const prev = msgs[i - 1];
          const mine = m.uid === user.uid;
          const newDay = !prev || !sameDay(prev.createdAt, m.createdAt);
          const showSender = !mine && (newDay || prev.uid !== m.uid);
          return (
            <div key={m.id}>
              {newDay && <div className="chat-day">{fmtDay(m.createdAt)}</div>}
              <div className={`chat-row ${mine ? "mine" : ""}`}>
                {!mine && (
                  <div className="chat-side">
                    {showSender && <ChatAvatar name={m.name} photoURL={m.photoURL} small />}
                  </div>
                )}
                <div className="chat-bubble">
                  {showSender && <div className="chat-sender">{m.name}</div>}
                  <div className="chat-text">{m.text}</div>
                  <div className="chat-time">{fmtTime(m.createdAt)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {err && <p className="msg admin-msg" style={{ margin: "0 12px 8px" }}>{err}</p>}

      <form className="chat-form" onSubmit={send}>
        <input
          className="chat-input"
          placeholder="Message likho"
          value={text}
          maxLength={2000}
          onChange={(e) => setText(e.target.value)}
          autoComplete="off"
        />
        <button className="btn" disabled={!text.trim()}>Bhejo</button>
      </form>
    </div>
  );
}
