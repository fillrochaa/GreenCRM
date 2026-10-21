import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: { default: "GreenCRM", template: "%s · GreenCRM" },
  description: "O cliente no centro, o pipeline em dia.",
};

// Aplica o tema salvo antes da primeira pintura, evitando o "piscar" do tema errado.
const themeScript = `try{var t=localStorage.getItem("greencrm-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={outfit.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Sidebar />
        <main className="min-h-dvh pl-[72px]">{children}</main>
      </body>
    </html>
  );
}
