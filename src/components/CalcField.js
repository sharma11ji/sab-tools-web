// Calculators ka ek input: upar label, neeche chhota hint
export default function CalcField({ label, hint, ...props }) {
  return (
    <label className="qr-label" style={{ marginBottom: 12 }}>
      {label}
      <input className="field" style={{ marginBottom: 0 }} inputMode="decimal" {...props} />
      {hint && <span className="calc-hint" style={{ margin: 0 }}>{hint}</span>}
    </label>
  );
}
