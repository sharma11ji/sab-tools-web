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
  {
    id: "builtin-sip-swp",
    name: "Step-Up SIP & SWP",
    description: "SIP aur SWP ka hisaab, saal-dar-saal",
    url: "/tools/sip-swp",
    icon: "/icons/sip-swp.svg",
  },
  {
    id: "builtin-salary-gratuity",
    name: "Salary Hike & Gratuity",
    description: "Hike % aur gratuity calculator",
    url: "/tools/salary-gratuity",
    icon: "/icons/salary-gratuity.svg",
  },
  {
    id: "builtin-gst-invoice",
    name: "GST Invoice Generator",
    description: "GST invoice banao, print ya PDF karo",
    url: "/tools/gst-invoice",
    icon: "/icons/gst-invoice.svg",
  },
  {
    id: "builtin-ifsc-finder",
    name: "IFSC Code Finder",
    description: "IFSC se bank branch ki details",
    url: "/tools/ifsc-finder",
    icon: "/icons/ifsc-finder.svg",
  },
];
