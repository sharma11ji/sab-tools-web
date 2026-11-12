"use client";
import { useState } from "react";

// Free public IFSC service (key nahi chahiye). Sirf IFSC code se branch ki details deta hai.
const API = "https://ifsc.razorpay.com/";
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const FIELDS = [
  ["BANK", "Bank"],
  ["BRANCH", "Branch"],
  ["ADDRESS", "Address"],
  ["CITY", "City"],
  ["DISTRICT", "District"],
  ["STATE", "State"],
  ["MICR", "MICR"],
  ["CONTACT", "Phone"],
];

export default function IfscFinderPage() {
  const [code, setCode] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function lookup(e) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    setData(null);
    setCopied(false);
    if (!IFSC_RE.test(c)) {
      setError("IFSC 11 akshar ka hota hai: pehle 4 akshar bank ke, 5va hamesha 0, phir 6 akshar/ank. Jaise SBIN0000001");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(API + c);
      if (res.status === 404) {
        setError("Ye IFSC nahi mila. Code dobara check karo.");
      } else if (!res.ok) {
        setError("Service abhi jawab nahi de rahi. Thodi der baad try karo.");
      } else {
        setData(await res.json());
      }
    } catch {
      setError("Internet ya service ki dikkat aayi. Thodi der baad try karo.");
    }
    setBusy(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(data.IFSC);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const yes = (v) => (v ? "Haan" : "Nahi");

  return (
    <div className="page calc">
      <h1>IFSC Code Finder</h1>
      <form onSubmit={lookup}>
        <input
          className="field"
          placeholder="IFSC code daalo, jaise SBIN0000001"
          value={code}
          maxLength={11}
          autoCapitalize="characters"
          autoComplete="off"
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <button className="btn" style={{ width: "100%" }} disabled={busy || !code.trim()}>
          {busy ? "Dhoondh raha hoon..." : "Branch ki details dekho"}
        </button>
      </form>

      {error && <p className="calc-warn">{error}</p>}

      {data && (
        <>
          <div className="calc-cards">
            <div className="calc-card dark wide">
              <small>IFSC</small>
              <strong>{data.IFSC}</strong>
            </div>
          </div>
          <button className="btn ghost small" onClick={copy}>{copied ? "Copy ho gaya" : "IFSC copy karo"}</button>

          <div className="calc-table-wrap" style={{ marginTop: 14 }}>
            <table className="calc-table kv">
              <tbody>
                {FIELDS.filter(([k]) => data[k]).map(([k, label]) => (
                  <tr key={k}><th>{label}</th><td>{String(data[k])}</td></tr>
                ))}
                <tr><th>NEFT</th><td>{yes(data.NEFT)}</td></tr>
                <tr><th>RTGS</th><td>{yes(data.RTGS)}</td></tr>
                <tr><th>IMPS</th><td>{yes(data.IMPS)}</td></tr>
                <tr><th>UPI</th><td>{yes(data.UPI)}</td></tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="calc-note">
        Ye tool IFSC code se branch ki details batata hai. Bank aur branch ka naam daalkar IFSC dhoondhne ke liye bank ki website ya
        cheque book dekho. Paisa bhejne se pehle bank ke saath ek baar details milana behtar hai.
      </p>
    </div>
  );
}
