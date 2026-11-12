// Calculators ka hisaab. Sab kuch browser mein, koi server nahi.

// Step-Up SIP: har mahine ki shuruaat mein paisa lagta hai, mahine ka byaaj r/12.
// Har 12 mahine baad SIP amount stepUp% se badhta hai.
export function stepUpSip({ amount, stepUp, rate, years }) {
  const i = rate / 100 / 12;
  let balance = 0;
  let invested = 0;
  let current = amount;
  const rows = [];
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      balance = (balance + current) * (1 + i);
      invested += current;
    }
    rows.push({ year: y, monthly: current, invested, value: balance });
    current = current * (1 + stepUp / 100);
  }
  return { invested, value: balance, gain: balance - invested, rows };
}

// SWP: corpus par har mahine byaaj judta hai, phir mahine ke ant mein withdrawal nikalta hai.
// raise% se withdrawal har saal badh sakta hai. Corpus khatam ho jaye to endedAt (mahine) batata hai.
export function swp({ corpus, amount, rate, years, raise }) {
  const i = rate / 100 / 12;
  let balance = corpus;
  let withdraw = amount;
  let total = 0;
  let endedAt = null;
  const rows = [];
  for (let y = 1; y <= years; y++) {
    let yearWithdrawn = 0;
    for (let m = 1; m <= 12; m++) {
      balance = balance * (1 + i);
      const take = Math.min(withdraw, balance);
      balance -= take;
      total += take;
      yearWithdrawn += take;
      if (balance <= 0.005) {
        balance = 0;
        endedAt = (y - 1) * 12 + m;
        break;
      }
    }
    rows.push({ year: y, withdrawn: yearWithdrawn, balance });
    if (endedAt) break;
    withdraw = withdraw * (1 + raise / 100);
  }
  return { total, balance, rows, endedAt };
}

// Salary hike
export const hikeNewSalary = (current, percent) => current * (1 + percent / 100);
export const hikePercent = (current, next) => (current > 0 ? ((next - current) / current) * 100 : 0);

// Gratuity
// Covered (Act/Code wala) employee: 15 din ki wages / 26. Covered nahi: /30.
// Aakhri saal mein 6 mahine se zyada ho to poora saal gina jata hai.
export const GRATUITY_TAX_FREE_LIMIT = 2000000; // Rs 20 lakh
export function gratuity({ basic, years, months, divisor }) {
  const counted = years + (months > 6 ? 1 : 0);
  return { counted, amount: (basic * 15 * counted) / divisor };
}

// Kam se kam kitni service chahiye (mahino mein). null = koi shart nahi.
export const GRATUITY_MIN_MONTHS = { permanent: 60, fixed: 12, special: null };
