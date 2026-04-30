import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RoleProvider } from "@/context/RoleContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { DataProvider } from "@/context/DataContext";
import LayoutWrapper from "@/components/LayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jade Land Registry | Hyperledger Fabric",
  description: "Next-generation Blockchain Land Record Management System powered by Hyperledger Fabric",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <RoleProvider>
            <DataProvider>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </DataProvider>
          </RoleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
