import "./globals.css";
import { AuthProvider } from "@/lib/useAuth";
import AppChrome from "@/components/AppChrome";

export const metadata = {
  title: "DSA Tracker",
  description: "Personal DSA practice tracker — topics, patterns, notes, goals, streaks.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-ink text-text">
        <AuthProvider>
          <AppChrome>{children}</AppChrome>
        </AuthProvider>
      </body>
    </html>
  );
}
