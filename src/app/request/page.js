"use client";
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

export default function RequestApi() {
  const { user, login } = useAuth();
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      await addDoc(collection(db, "apiRequests"), {
        name: name.trim(),
        details: details.trim(),
        uid: user.uid,
        email: user.email,
        createdAt: serverTimestamp(),
      });
      setName("");
      setDetails("");
      setMsg("Request bhej di gayi!");
    } catch (err) {
      console.error(err);
      setMsg("Request nahi gayi, dobara try karo.");
    }
    setBusy(false);
  }

  if (!user) {
    return (
      <div className="page">
        <h1>Request an API</h1>
        <p style={{ marginBottom: 16 }}>Request bhejne ke liye pehle sign in karo.</p>
        <button className="btn" onClick={() => login().catch(console.error)}>Sign in with Google</button>
      </div>
    );
  }

  return (
    <form className="page" onSubmit={submit}>
      <h1>Request an API</h1>
      <input className="field" required placeholder="API / Tool ka naam" value={name} onChange={(e) => setName(e.target.value)} />
      <textarea className="field" rows={5} placeholder="Kya chahiye? (details)" value={details} onChange={(e) => setDetails(e.target.value)} />
      <button className="btn" disabled={busy}>{busy ? "Bhej raha hoon..." : "Submit"}</button>
      {msg && <p className="msg">{msg}</p>}
    </form>
  );
}
