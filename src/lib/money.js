// Paise-rupees dikhane aur "amount in words" ke chhote helpers

export function numFrom(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

// Poore rupaye, Indian grouping: ₹12,34,567
export function inr(n) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

// Paise ke saath: ₹1,234.50
export function inr2(n) {
  return (
    "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function below100(n) {
  return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
}

function below1000(n) {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? ONES[h] + " Hundred" : "", r ? below100(r) : ""].filter(Boolean).join(" ");
}

// Poori sankhya ko Indian system mein shabdon mein (Crore / Lakh / Thousand)
export function numberToWords(n) {
  if (n === 0) return "Zero";
  const parts = [];
  const crore = Math.floor(n / 1e7);
  n %= 1e7;
  const lakh = Math.floor(n / 1e5);
  n %= 1e5;
  const thousand = Math.floor(n / 1e3);
  n %= 1e3;
  if (crore) parts.push(numberToWords(crore) + " Crore");
  if (lakh) parts.push(below100(lakh) + " Lakh");
  if (thousand) parts.push(below100(thousand) + " Thousand");
  if (n) parts.push(below1000(n));
  return parts.join(" ");
}

// 1234.5 -> "Rupees One Thousand Two Hundred Thirty Four and Fifty Paise Only"
export function amountInWords(amount) {
  const total = Math.round(amount * 100);
  const rupees = Math.floor(total / 100);
  const paise = total % 100;
  let s = "Rupees " + numberToWords(rupees);
  if (paise) s += " and " + numberToWords(paise) + " Paise";
  return s + " Only";
}
