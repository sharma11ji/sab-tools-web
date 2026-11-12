"use client";
import { useMemo, useState } from "react";
import CalcField from "@/components/CalcField";
import { stepUpSip, swp } from "@/lib/finance";
import { inr, numFrom } from "@/lib/money";

const MAX_YEARS = 60;
const years = (v) => Math.min(MAX_YEARS, Math.max(0, Math.floor(numFrom(v))));

export default function SipSwpPage() {
  const [tab, setTab] = useState("sip");
  const [s, setS] = useState({ amount: "10000", stepUp: "10", rate: "12", years: "10" });
  const [w, setW] = useState({ corpus: "5000000", amount: "30000", rate: "8", years: "20", raise: "0" });
  const setSip = (k) => (e) => setS((o) => ({ ...o, [k]: e.target.value }));
  const setSwp = (k) => (e) => setW((o) => ({ ...o, [k]: e.target.value }));

  const sipRes = useMemo(() => {
    const amount = numFrom(s.amount);
    const y = years(s.years);
    if (amount <= 0 || y < 1) return null;
    return stepUpSip({ amount, stepUp: Math.max(0, numFrom(s.stepUp)), rate: Math.max(0, numFrom(s.rate)), years: y });
  }, [s]);

  const swpRes = useMemo(() => {
    const corpus = numFrom(w.corpus);
    const amount = numFrom(w.amount);
    const y = years(w.years);
    if (corpus <= 0 || amount <= 0 || y < 1) return null;
    return swp({ corpus, amount, rate: Math.max(0, numFrom(w.rate)), years: y, raise: Math.max(0, numFrom(w.raise)) });
  }, [w]);

  return (
    <div className="page calc">
      <h1>Step-Up SIP &amp; SWP</h1>

      <div className="tabs">
        <button className={`tab ${tab === "sip" ? "active" : ""}`} onClick={() => setTab("sip")}>Step-Up SIP</button>
        <button className={`tab ${tab === "swp" ? "active" : ""}`} onClick={() => setTab("swp")}>SWP</button>
      </div>

      {tab === "sip" && (
        <>
          <CalcField label="Pehle mahine ki SIP (₹)" value={s.amount} onChange={setSip("amount")} />
          <div className="qr-row">
            <CalcField label="Step-up (% har saal)" value={s.stepUp} onChange={setSip("stepUp")} />
            <CalcField label="Expected return (% saal)" value={s.rate} onChange={setSip("rate")} />
          </div>
          <CalcField label="Kitne saal (max 60)" value={s.years} onChange={setSip("years")} />

          {!sipRes && <p className="calc-warn">Sahi SIP amount aur saal daalo.</p>}
          {sipRes && (
            <>
              <div className="calc-cards">
                <div className="calc-card"><small>Kul lagaya</small><strong>{inr(sipRes.invested)}</strong></div>
                <div className="calc-card"><small>Andaza byaaj</small><strong>{inr(sipRes.gain)}</strong></div>
                <div className="calc-card dark wide"><small>Ant mein kul value</small><strong>{inr(sipRes.value)}</strong></div>
              </div>
              <div className="calc-table-wrap">
                <table className="calc-table">
                  <thead><tr><th>Saal</th><th>Mahine ki SIP</th><th>Kul lagaya</th><th>Value</th></tr></thead>
                  <tbody>
                    {sipRes.rows.map((r) => (
                      <tr key={r.year}><td>{r.year}</td><td>{inr(r.monthly)}</td><td>{inr(r.invested)}</td><td>{inr(r.value)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {tab === "swp" && (
        <>
          <CalcField label="Kul corpus (₹)" value={w.corpus} onChange={setSwp("corpus")} />
          <div className="qr-row">
            <CalcField label="Mahine ka withdrawal (₹)" value={w.amount} onChange={setSwp("amount")} />
            <CalcField label="Expected return (% saal)" value={w.rate} onChange={setSwp("rate")} />
          </div>
          <div className="qr-row">
            <CalcField label="Kitne saal (max 60)" value={w.years} onChange={setSwp("years")} />
            <CalcField label="Withdrawal badhe (% saal, 0 = same)" value={w.raise} onChange={setSwp("raise")} />
          </div>

          {!swpRes && <p className="calc-warn">Sahi corpus, withdrawal aur saal daalo.</p>}
          {swpRes && (
            <>
              {swpRes.endedAt ? (
                <p className="calc-warn">
                  Is withdrawal par corpus {Math.floor((swpRes.endedAt - 1) / 12)} saal {((swpRes.endedAt - 1) % 12) + 1} mahine mein khatam ho jayega.
                </p>
              ) : (
                <p className="calc-note" style={{ marginTop: 0 }}>Itne saal tak corpus bacha rahega.</p>
              )}
              <div className="calc-cards">
                <div className="calc-card"><small>Kul nikala</small><strong>{inr(swpRes.total)}</strong></div>
                <div className="calc-card dark"><small>Ant mein bacha corpus</small><strong>{inr(swpRes.balance)}</strong></div>
              </div>
              <div className="calc-table-wrap">
                <table className="calc-table">
                  <thead><tr><th>Saal</th><th>Is saal nikala</th><th>Bacha corpus</th></tr></thead>
                  <tbody>
                    {swpRes.rows.map((r) => (
                      <tr key={r.year}><td>{r.year}</td><td>{inr(r.withdrawn)}</td><td>{inr(r.balance)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      <p className="calc-note">
        Ye sirf andaza hai. Asli return fixed nahi hota, aur tax, expense ratio ya exit load isme nahi joda gaya. SIP har mahine
        ki shuruaat mein lagti hai, byaaj mahine ke hisaab se (saalana rate / 12) judta hai.
      </p>
    </div>
  );
}
