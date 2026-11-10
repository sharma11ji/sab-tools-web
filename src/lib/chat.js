import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export const PUBLIC_ID = "public";

// Chat mein dikhne wala naam. Email poori nahi dikhate, sirf @ se pehle ka hissa.
export function displayNameOf(user) {
  const n = user?.displayName || user?.email?.split("@")[0] || "User";
  return n.slice(0, 60);
}

// Apni profile (naam + photo) users collection mein rakho, taaki dusre dhoondh sakein.
export function saveProfile(user) {
  return setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      name: displayNameOf(user),
      photoURL: user.photoURL || "",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// 1-to-1 chat ka id: dono uid sort karke "_" se jodo, taaki dono taraf wahi chat khule.
// Pehle se bani ho to kuch badalta nahi (merge), nahi to nayi ban jaati hai.
export async function openDm(myUid, otherUid) {
  const members = [myUid, otherUid].sort();
  const id = members.join("_");
  await setDoc(doc(db, "chats", id), { type: "dm", members }, { merge: true });
  return id;
}

// Message ka samay, jaise "04:51 pm"
export function fmtTime(ts) {
  const d = ts?.toDate?.();
  if (!d) return "";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// Din badalne par dikhne wala label: "Aaj" ya "11 Nov"
export function fmtDay(ts) {
  const d = ts?.toDate?.();
  if (!d) return "";
  if (d.toDateString() === new Date().toDateString()) return "Aaj";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function sameDay(a, b) {
  const x = a?.toDate?.();
  const y = b?.toDate?.();
  return !!x && !!y && x.toDateString() === y.toDateString();
}
