"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BUILTIN_TOOLS } from "@/lib/builtinTools";
import { useShell } from "@/components/Shell";
import SkeletonGrid from "@/components/SkeletonGrid";
import ToolIcon from "@/components/ToolIcon";

function Card({ a }) {
  const inner = (
    <>
      {a.icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={a.icon} alt={a.name} />
      ) : (
        <ToolIcon name={a.name} />
      )}
      <span>{a.name}</span>
      {a.description && <small className="card-desc">{a.description}</small>}
    </>
  );

  // Site ke andar ke tools usi tab mein khulte hain, bahar ke links naye tab mein.
  if (a.url && a.url.startsWith("/")) {
    return <Link className="card" href={a.url}>{inner}</Link>;
  }
  return (
    <a className="card" href={a.url || "#"} target="_blank" rel="noreferrer">
      {inner}
    </a>
  );
}

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
  const all = [...BUILTIN_TOOLS, ...apis];
  const list = q ? all.filter((a) => (a.name || "").toLowerCase().includes(q)) : all;

  if (!list.length) {
    return <p className="empty">Koi result nahi mila.</p>;
  }

  return (
    <>
      {error && <p className="empty" style={{ paddingBottom: 0 }}>{error}</p>}
      <main className="grid">
        {list.map((a) => (
          <Card key={a.id} a={a} />
        ))}
      </main>
    </>
  );
}
