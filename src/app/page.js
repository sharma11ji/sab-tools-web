"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useShell } from "@/components/Shell";
import SkeletonGrid from "@/components/SkeletonGrid";
import ApiIcon from "@/components/ApiIcon";

export default function Home() {
  const [apis, setApis] = useState(null); // null = loading
  const [error, setError] = useState("");
  const { query: search } = useShell();

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, "apis"), orderBy("createdAt", "desc")));
        setApis(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
        setError("APIs load nahi ho paaye. Firestore rules check karo.");
        setApis([]);
      }
    })();
  }, []);

  if (apis === null) return <SkeletonGrid />;

  const q = search.trim().toLowerCase();
  const list = q ? apis.filter((a) => (a.name || "").toLowerCase().includes(q)) : apis;

  if (!list.length) {
    return <p className="empty">{error || "Abhi koi API listed nahi hai."}</p>;
  }

  return (
    <main className="grid">
      {list.map((a) => (
        <a key={a.id} className="card" href={a.url || "#"} target="_blank" rel="noreferrer">
          {a.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.icon} alt={a.name} />
          ) : (
            <ApiIcon />
          )}
          <span>{a.name}</span>
          {a.description && <small className="card-desc">{a.description}</small>}
        </a>
      ))}
    </main>
  );
}
