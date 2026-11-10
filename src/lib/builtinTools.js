// Site ke andar bane hue tools. Ye hamesha home page par dikhte hain,
// Firestore mein alag se add karne ki zaroorat nahi.
export const BUILTIN_TOOLS = [
  {
    id: "builtin-qr-code",
    name: "QR Code Generator",
    description: "Text ya link se QR code banao",
    url: "/tools/qr-code",
    icon: "/icons/qr-code.svg",
  },
  {
    id: "builtin-chat",
    name: "SAB Chat",
    description: "Public room, 1-to-1 aur group chat",
    url: "/chat",
    icon: "/icons/chat.svg",
  },
];
