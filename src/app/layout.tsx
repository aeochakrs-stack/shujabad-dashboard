import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shujabad Education Dashboard",
  description: "Manage, compile, and export education data across Shujabad.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const authSession = cookieStore.get('auth_session')?.value;

  if (!authSession) {
    redirect('/login');
  }

  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-64 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
