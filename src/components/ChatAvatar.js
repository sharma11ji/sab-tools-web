// Chat mein profile photo. Photo na ho to naam ka pehla akshar dikhta hai.
export default function ChatAvatar({ name, photoURL, small }) {
  const cls = `chat-avatar${small ? " sm" : ""}`;
  if (photoURL) {
    return <img className={cls} src={photoURL} alt="" referrerPolicy="no-referrer" />;
  }
  return <span className={cls}>{(name || "?").trim().charAt(0).toUpperCase()}</span>;
}
