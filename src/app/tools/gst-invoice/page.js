"use client";
import { useEffect, useMemo, useState } from "react";
import { amountInWords, inr2, numFrom } from "@/lib/money";

const STATES = [
  ["01", "Jammu & Kashmir"], ["02", "Himachal Pradesh"], ["03", "Punjab"], ["04", "Chandigarh"],
  ["05", "Uttarakhand"], ["06", "Haryana"], ["07", "Delhi"], ["08", "Rajasthan"], ["09", "Uttar Pradesh"],
  ["10", "Bihar"], ["11", "Sikkim"], ["12", "Arunachal Pradesh"], ["13", "Nagaland"], ["14", "Manipur"],
  ["15", "Mizoram"], ["16", "Tripura"], ["17", "Meghalaya"], ["18", "Assam"], ["19", "West Bengal"],
  ["20", "Jharkhand"], ["21", "Odisha"], ["22", "Chhattisgarh"], ["23", "Madhya Pradesh"], ["24", "Gujarat"],
  ["26", "Dadra & Nagar Haveli and Daman & Diu"], ["27", "Maharashtra"], ["29", "Karnataka"], ["30", "Goa"],
  ["31", "Lakshadweep"], ["32", "Kerala"], ["33", "Tamil Nadu"], ["34", "Puducherry"],
  ["35", "Andaman & Nicobar Islands"], ["36", "Telangana"], ["37", "Andhra Pradesh"], ["38", "Ladakh"],
  ["97", "Other Territory"],
];
const stateName = (code) => STATES.find(([c]) => c === code)?.[1] || "";

const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const SELLER_KEY = "sabtools-gst-seller";
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const newItem = () => ({ id: Math.random().toString(36).slice(2), desc: "", hsn: "", qty: "1", rate: "", gst: "18" });
const EMPTY_PARTY = { name: "", gstin: "", address: "", state: "" };

function PartyForm({ title, value, onChange }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  const bad = value.gstin && !GSTIN_RE.test(value.gstin);
  return (
    <div>
      <h2 style={{ fontSize: 17, margin: "16px 0 10px" }}>{title}</h2>
      <input className="field" placeholder="Naam / firm ka naam" value={value.name} onChange={set("name")} />
      <input
        className="field"
        placeholder="GSTIN (15 akshar, optional)"
        maxLength={15}
        value={value.gstin}
        onChange={(e) => onChange({ ...value, gstin: e.target.value.toUpperCase() })}
      />
      {bad && <p className="calc-hint" style={{ margin: "-6px 0 10px", color: "#a00" }}>GSTIN ka format sahi nahi lag raha.</p>}
      <textarea className="field" rows={2} placeholder="Pata" value={value.address} onChange={set("address")} />
      <select className="field" value={value.state} onChange={set("state")}>
        <option value="">State chuno</option>
        {STATES.map(([c, n]) => (
          <option key={c} value={c}>{c} - {n}</option>
        ))}
      </select>
    </div>
  );
}

export default function GstInvoicePage() {
  const [seller, setSeller] = useState(EMPTY_PARTY);
  const [buyer, setBuyer] = useState(EMPTY_PARTY);
  const [inv, setInv] = useState({ no: "INV-001", date: "" });
  const [items, setItems] = useState([newItem()]);
  const [roundOff, setRoundOff] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Seller ki details browser mein yaad rakho (sirf is device par)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SELLER_KEY) || "null");
      if (saved) setSeller({ ...EMPTY_PARTY, ...saved });
    } catch {}
    setInv((o) => ({ ...o, date: new Date().toLocaleDateString("en-CA") }));
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(SELLER_KEY, JSON.stringify(seller));
    } catch {}
  }, [seller, loaded]);

  const setItem = (id, k, v) => setItems((l) => l.map((it) => (it.id === id ? { ...it, [k]: v } : it)));

  const calc = useMemo(() => {
    const known = !!(seller.state && buyer.state);
    const intra = known && seller.state === buyer.state;
    const rows = items
      .map((it) => {
        const qty = numFrom(it.qty);
        const rate = numFrom(it.rate);
        const g = Math.max(0, numFrom(it.gst));
        const taxable = round2(qty * rate);
        const cgst = intra ? round2((taxable * g) / 200) : 0;
        const sgst = cgst;
        const igst = intra ? 0 : round2((taxable * g) / 100);
        return { ...it, qty, rate, g, taxable, cgst, sgst, igst, tax: cgst + sgst + igst };
      })
      .filter((r) => r.taxable > 0);
    const sum = (k) => round2(rows.reduce((a, r) => a + r[k], 0));
    const taxable = sum("taxable");
    const cgst = sum("cgst");
    const sgst = sum("sgst");
    const igst = sum("igst");
    const exact = round2(taxable + cgst + sgst + igst);
    const total = roundOff ? Math.round(exact) : exact;
    return { known, intra, rows, taxable, cgst, sgst, igst, exact, total, diff: round2(total - exact) };
  }, [items, seller.state, buyer.state, roundOff]);

  return (
    <div className="page calc invoice-page">
      <div className="no-print">
        <h1>GST Invoice Generator</h1>

        <div className="inv-grid">
          <PartyForm title="Bechne wala (aap)" value={seller} onChange={setSeller} />
          <PartyForm title="Kharidne wala" value={buyer} onChange={setBuyer} />
        </div>

        <h2 style={{ fontSize: 17, margin: "16px 0 10px" }}>Invoice</h2>
        <div className="qr-row">
          <label className="qr-label">Invoice number
            <input className="field" style={{ marginBottom: 0 }} value={inv.no} onChange={(e) => setInv({ ...inv, no: e.target.value })} />
          </label>
          <label className="qr-label">Date
            <input className="field" style={{ marginBottom: 0 }} type="date" value={inv.date} onChange={(e) => setInv({ ...inv, date: e.target.value })} />
          </label>
        </div>

        <h2 style={{ fontSize: 17, margin: "16px 0 10px" }}>Saman / service</h2>
        {items.map((it, idx) => (
          <div className="inv-item" key={it.id}>
            <input className="field" placeholder={`Item ${idx + 1} ka description`} value={it.desc} onChange={(e) => setItem(it.id, "desc", e.target.value)} />
            <div className="qr-row">
              <input className="field" style={{ marginBottom: 0 }} placeholder="HSN/SAC" value={it.hsn} onChange={(e) => setItem(it.id, "hsn", e.target.value)} />
              <input className="field" style={{ marginBottom: 0 }} inputMode="decimal" placeholder="Quantity" value={it.qty} onChange={(e) => setItem(it.id, "qty", e.target.value)} />
            </div>
            <div className="qr-row" style={{ marginTop: 10 }}>
              <input className="field" style={{ marginBottom: 0 }} inputMode="decimal" placeholder="Rate (₹, GST se pehle)" value={it.rate} onChange={(e) => setItem(it.id, "rate", e.target.value)} />
              <input className="field" style={{ marginBottom: 0 }} inputMode="decimal" list="gst-rates" placeholder="GST %" value={it.gst} onChange={(e) => setItem(it.id, "gst", e.target.value)} />
            </div>
            {items.length > 1 && (
              <button className="btn small danger" style={{ marginTop: 10 }} onClick={() => setItems((l) => l.filter((x) => x.id !== it.id))}>
                Ye item hatao
              </button>
            )}
          </div>
        ))}
        <datalist id="gst-rates">
          <option value="0" /><option value="5" /><option value="18" /><option value="40" />
        </datalist>
        <button className="btn ghost small" onClick={() => setItems((l) => [...l, newItem()])}>+ Item jodo</button>

        <label style={{ display: "flex", gap: 8, alignItems: "center", margin: "16px 0", fontSize: 14 }}>
          <input type="checkbox" checked={roundOff} onChange={(e) => setRoundOff(e.target.checked)} />
          Total ko poore rupaye mein round karo
        </label>

        {!calc.known && (
          <p className="calc-warn">Dono taraf ki state chuno, tab CGST+SGST ya IGST sahi lagega. Abhi IGST maana ja raha hai.</p>
        )}
      </div>

      {calc.rows.length === 0 ? (
        <p className="calc-note no-print">Kam se kam ek item ka rate aur quantity daalo, invoice yahin neeche ban jayega.</p>
      ) : (
        <>
          <div className="invoice">
            <h2>TAX INVOICE</h2>
            <div className="inv-parties">
              <div>
                <h4>Bechne wala</h4>
                <strong>{seller.name || "-"}</strong>
                {seller.gstin && <div>GSTIN: {seller.gstin}</div>}
                {seller.address && <div style={{ whiteSpace: "pre-wrap" }}>{seller.address}</div>}
                {seller.state && <div>{stateName(seller.state)} ({seller.state})</div>}
              </div>
              <div>
                <h4>Bill to</h4>
                <strong>{buyer.name || "-"}</strong>
                {buyer.gstin && <div>GSTIN: {buyer.gstin}</div>}
                {buyer.address && <div style={{ whiteSpace: "pre-wrap" }}>{buyer.address}</div>}
                {buyer.state && <div>Place of supply: {stateName(buyer.state)} ({buyer.state})</div>}
              </div>
            </div>
            <div className="inv-parties" style={{ marginBottom: 8 }}>
              <div>Invoice no: <strong>{inv.no || "-"}</strong></div>
              <div>Date: <strong>{inv.date ? inv.date.split("-").reverse().join("/") : "-"}</strong></div>
            </div>

            <div className="calc-table-wrap">
              <table className="calc-table inv-table">
                <thead>
                  <tr><th>#</th><th>Description</th><th>HSN</th><th>Qty</th><th>Rate</th><th>Taxable</th><th>GST%</th><th>GST</th></tr>
                </thead>
                <tbody>
                  {calc.rows.map((r, i) => (
                    <tr key={r.id}>
                      <td>{i + 1}</td>
                      <td style={{ whiteSpace: "normal", textAlign: "left" }}>{r.desc || "-"}</td>
                      <td>{r.hsn || "-"}</td>
                      <td>{r.qty}</td>
                      <td>{inr2(r.rate)}</td>
                      <td>{inr2(r.taxable)}</td>
                      <td>{r.g}%</td>
                      <td>{inr2(r.tax)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="inv-totals">
              <div><span>Taxable amount</span><span>{inr2(calc.taxable)}</span></div>
              {calc.intra ? (
                <>
                  <div><span>CGST</span><span>{inr2(calc.cgst)}</span></div>
                  <div><span>SGST</span><span>{inr2(calc.sgst)}</span></div>
                </>
              ) : (
                <div><span>IGST</span><span>{inr2(calc.igst)}</span></div>
              )}
              {roundOff && calc.diff !== 0 && <div><span>Round off</span><span>{inr2(calc.diff)}</span></div>}
              <div className="grand"><span>Total</span><span>{inr2(calc.total)}</span></div>
            </div>
            <p style={{ fontSize: 13, marginTop: 10 }}><strong>Amount in words:</strong> {amountInWords(calc.total)}</p>
            <p style={{ fontSize: 11, color: "#555", marginTop: 8 }}>Ye computer se bana invoice hai.</p>
          </div>

          <div className="no-print" style={{ marginTop: 16 }}>
            <button className="btn" style={{ width: "100%" }} onClick={() => window.print()}>Print karo / PDF save karo</button>
            <p className="calc-note">
              Print window mein &quot;Save as PDF&quot; chuno. Seller ki details sirf is device ke browser mein yaad rehti hain.
              GST rate apne saman ke hisaab se khud check kar lo, aur filing ke liye apne CA se milao.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
