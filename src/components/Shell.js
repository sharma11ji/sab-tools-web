"use client";
import { createContext, useContext, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

const ShellContext = createContext({ query: "" });
export const useShell = () => useContext(ShellContext);

export default function Shell({ children }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <ShellContext.Provider value={{ query }}>
      <Header
        onMenu={() => setOpen(true)}
        onSearchOpen={() => setOpen(false)}
        query={query}
        setQuery={setQuery}
      />
      <Sidebar open={open} onClose={() => setOpen(false)} />
      {children}
    </ShellContext.Provider>
  );
}
