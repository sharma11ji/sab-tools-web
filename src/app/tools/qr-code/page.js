"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

const SIZES = [256, 512, 1024];
const LEVELS = [
  { v: "L", label: "Low" },
  { v: "M", label: "Medium" },
  { v: "Q", label: "High" },
  { v: "H", label: "Max" },
];

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export default function QrCodePage() {
  const [text, setText] = useState("");
  const [size, setSize] = useState(512);
  const [level, setLevel] = useState("M");
  const [fg, setFg] = useState("#000000");
  const [bg, setBg] = useState("#ffffff");
  const [png, setPng] = useState("");
  const [error, setError] = useState("");

  const options = { margin: 2, errorCorrectionLevel: level, color: { dark: fg, light: bg } };

  useEffect(() => {
    if (!text.trim()) {
      setPng("");
      setError("");
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(text, { ...options, width: size })
      .then((url) => {
        if (cancelled) return;
        setPng(url);
        setError("");
      })
      .catch(() => {
        if (cancelled) return;
        setPng("");
        setError("Text bahut lamba hai, QR nahi ban paaya. Chhota karke dekho.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, size, level, fg, bg]);

  function save(href, filename) {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function downloadSvg() {
    const svg = await QRCode.toString(text, { ...options, type: "svg" });
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    save(url, "qr-code.svg");
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const lowContrast = contrast(fg, bg) < 3;
  const inverted = luminance(fg) > luminance(bg);

  return (
    <div className="page">
      <h1>QR Code Generator</h1>

      <textarea
        className="field"
        rows={4}
        placeholder="Yahan link ya text likho (jaise https://example.com)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="qr-row">
        <label className="qr-label">
          Size
          <select className="field qr-select" value={size} onChange={(e) => setSize(Number(e.target.value))}>
            {SIZES.map((s) => (
              <option key={s} value={s}>{s} px</option>
            ))}
          </select>
        </label>
        <label className="qr-label">
          Error correction
          <select className="field qr-select" value={level} onChange={(e) => setLevel(e.target.value)}>
            {LEVELS.map((l) => (
              <option key={l.v} value={l.v}>{l.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="qr-row">
        <label className="qr-label">
          QR ka rang
          <input className="qr-color" type="color" value={fg} onChange={(e) => setFg(e.target.value)} />
        </label>
        <label className="qr-label">
          Background
          <input className="qr-color" type="color" value={bg} onChange={(e) => setBg(e.target.value)} />
        </label>
      </div>

      {(lowContrast || inverted) && (
        <p className="msg" style={{ color: "#b45309" }}>
          {lowContrast
            ? "Rang aur background bahut milte-julte hain, QR scan nahi ho sakta."
            : "Gehre background par halka QR kai scanners nahi padh paate. Ulta kar do to behtar hai."}
        </p>
      )}

      {error && <p className="msg" style={{ color: "#c00" }}>{error}</p>}

      <div className="qr-preview">
        {png ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={png} alt="Generated QR code" />
        ) : (
          <p className="empty" style={{ padding: "40px 0" }}>QR yahan dikhega</p>
        )}
      </div>

      {png && (
        <div className="qr-row">
          <button className="btn" onClick={() => save(png, "qr-code.png")}>Download PNG</button>
          <button className="btn ghost" onClick={downloadSvg}>Download SVG</button>
        </div>
      )}
    </div>
  );
}
