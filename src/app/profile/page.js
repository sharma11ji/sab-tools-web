"use client";
import { useAuth } from "@/lib/AuthContext";

export default function Profile() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="page profile-box">
        <div className="skeleton" style={{ width: 96, height: 96, borderRadius: "50%" }} />
        <div className="skeleton" style={{ width: 160, height: 18 }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page profile-box">
        <svg width="110" height="110" viewBox="0 0 24 24" fill="#000">
          <circle cx="12" cy="7" r="5" />
          <path d="M2 22c0-6 4.5-9 10-9s10 3 10 9z" />
        </svg>
        <button className="btn" onClick={() => login().catch(console.error)}>
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="page profile-box">
      {user.photoURL && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
      )}
      <h2>{user.displayName}</h2>
      <p>{user.email}</p>
      <button className="btn ghost" onClick={logout}>Sign out</button>
    </div>
  );
}
