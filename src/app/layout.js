import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import Shell from "@/components/Shell";

export const metadata = {
  title: "SAB Tools",
  description: "Tools aur APIs ki listing",
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Shell>{children}</Shell>
        </AuthProvider>
      </body>
    </html>
  );
}
