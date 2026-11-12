"use client";
import { useMemo, useState } from "react";
import CalcField from "@/components/CalcField";
import {
  GRATUITY_MIN_MONTHS,
  GRATUITY_TAX_FREE_LIMIT,
  gratuity,
  hikeNewSalary,
  hikePercent,
} from "@/lib/finance";
import { inr, numFrom } from "@/lib/money";

export default function SalaryGratuityPage() {
  const [tab, setTab] = useState("hike");

  // Salary hike
  const [period, setPeriod] = useState("month"); // month | year
  const [cur, setCur] = useState("40000");
  const [pct, setPct] = useState("10");
  const [next, setNext] = useState("45000");

  // Gratuity
  const [g, setG] = useState({ basic: "30000", years: "8", months: "4" });
  const [kind, setKind] = useState("permanent"); // permanent | fixed | special
  const [divisor, setDivisor] = useState("26");

  const per = period === "month" ? "mahine" : "saal";
  const other = period === "month" ? "saal" : "mahine";
  const toOther = (v) => (period === "month" ? v * 12 : v / 12);

  const hike = useMemo(() => {
    const c = numFrom(cur);
    if (c <= 0) return null;
    const n = hikeNewSalary(c, numFrom(pct));
    return { next: n, diff: n - c };
  }, [cur, pct]);

  const reverse = useMemo(() => {
    const c = numFrom(cur);
    const n = numFrom(next);
    if (c <= 0 || n <= 0) return null;
    return { percent: hikePercent(c, n), diff: n - c };
  }, [cur, next]);

  const grat = useMemo(() => {
    const basic = numFrom(g.basic);
    const years = Math.max(0, Math.floor(numFrom(g.years)));
    const months = Math.min(11, Math.max(0, Math.floor(numFrom(g.months))));
    if (basic <= 0 || (years === 0 && months === 0)) return null;
    const res = gratuity({ basic, years, months, divisor: Number(divisor) });
    const min = GRATUITY_MIN_MONTHS[kind];
    const served = years * 12 + months;
    return { ...res, eligible: min === null || served >= min, min };
  }, [g, kind, divisor]);

  return (
    <div className="page calc">
      <h1>Salary Hike &amp; Gratuity</h1>

      <div className="tabs">
        <button className={`tab ${tab === "hike" ? "active" : ""}`} onClick={() => setTab("hike")}>Salary Hike</button>
        <button className={`tab ${tab === "grat" ? "active" : ""}`} onClick={() => setTab("grat")}>Gratuity</button>
      </div>

      {tab === "hike" && (
        <>
          <label className="qr-label" style={{ marginBottom: 12 }}>
            Salary kis hisaab se daal rahe ho?
            <select className="field qr-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="month">Mahine ki salary</option>
              <option value="year">Saal ka package</option>
            </select>
          </label>
          <CalcField label={`Abhi ki salary (₹ ${per})`} value={cur} onChange={(e) => setCur(e.target.value)} />

          <h2 style={{ fontSize: 17, margin: "18px 0 10px" }}>1. Hike % se naya salary</h2>
          <CalcField label="Hike (%)" value={pct} onChange={(e) => setPct(e.target.value)} />
          {hike && (
            <div className="calc-cards">
              <div className="calc-card dark"><small>Naya salary ({per})</small><strong>{inr(hike.next)}</strong></div>
              <div className="calc-card"><small>Badhotri ({per})</small><strong>{inr(hike.diff)}</strong></div>
              <div className="calc-card wide"><small>Naya salary ({other})</small><strong>{inr(toOther(hike.next))}</strong></div>
            </div>
          )}

          <h2 style={{ fontSize: 17, margin: "22px 0 10px" }}>2. Naye salary se hike %</h2>
          <CalcField label={`Naya salary (₹ ${per})`} value={next} onChange={(e) => setNext(e.target.value)} />
          {reverse && (
            <div className="calc-cards">
              <div className="calc-card dark"><small>Hike</small><strong>{reverse.percent.toFixed(2)}%</strong></div>
              <div className="calc-card"><small>Badhotri ({per})</small><strong>{inr(reverse.diff)}</strong></div>
            </div>
          )}
          {!hike && <p className="calc-warn">Abhi ki salary daalo.</p>}
          <p className="calc-note">Ye gross (kat-ne se pehle) salary par hai. In-hand salary tax aur PF ke baad alag hogi.</p>
        </>
      )}

      {tab === "grat" && (
        <>
          <CalcField
            label="Aakhri basic + DA (₹ mahine)"
            hint="Naye Labour Code mein 'wages' kam se kam kul salary ka 50% maani jaati hai"
            value={g.basic}
            onChange={(e) => setG((o) => ({ ...o, basic: e.target.value }))}
          />
          <div className="qr-row">
            <CalcField label="Service: saal" inputMode="numeric" value={g.years} onChange={(e) => setG((o) => ({ ...o, years: e.target.value }))} />
            <CalcField label="Aur mahine (0-11)" inputMode="numeric" value={g.months} onChange={(e) => setG((o) => ({ ...o, months: e.target.value }))} />
          </div>
          <label className="qr-label" style={{ marginBottom: 12 }}>
            Employee ka type
            <select className="field qr-select" value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="permanent">Permanent (kam se kam 5 saal)</option>
              <option value="fixed">Fixed-term (kam se kam 1 saal)</option>
              <option value="special">Maut ya disability (koi minimum nahi)</option>
            </select>
          </label>
          <label className="qr-label" style={{ marginBottom: 12 }}>
            Company par kaunsa formula lagta hai?
            <select className="field qr-select" value={divisor} onChange={(e) => setDivisor(e.target.value)}>
              <option value="26">Gratuity law ke andar aati hai (15 / 26)</option>
              <option value="30">Law ke andar nahi aati (15 / 30)</option>
            </select>
          </label>

          {!grat && <p className="calc-warn">Basic salary aur service daalo.</p>}
          {grat && (
            <>
              {!grat.eligible && (
                <p className="calc-warn">
                  Abhi eligibility nahi bani: {grat.min === 60 ? "5 saal" : "1 saal"} ki service poori honi chahiye. Neeche amount tab ka hai jab ye poori ho.
                </p>
              )}
              <div className="calc-cards">
                <div className="calc-card"><small>Gina gaya service</small><strong>{grat.counted} saal</strong></div>
                <div className="calc-card dark"><small>Gratuity</small><strong>{inr(grat.amount)}</strong></div>
                {grat.amount > GRATUITY_TAX_FREE_LIMIT && (
                  <div className="calc-card wide">
                    <small>₹20 lakh se upar ka hissa (tax lag sakta hai)</small>
                    <strong>{inr(grat.amount - GRATUITY_TAX_FREE_LIMIT)}</strong>
                  </div>
                )}
              </div>
            </>
          )}
          <p className="calc-note">
            Formula: (15 x aakhri wages x saal) / 26 ya 30. Aakhri saal mein 6 mahine se zyada ho to poora saal gina jata hai.
            ₹20 lakh ki limit alag se lagti hai. Ye sirf andaza hai, pakka hisaab company ke HR / apne sector ke niyam se milao.
          </p>
        </>
      )}
    </div>
  );
}
