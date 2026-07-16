import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Providers from "@/lib/providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Next-Hono-Ecommerce",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full antialiased" data-theme="forest">
        <body className="min-h-full flex flex-col">
          <Providers>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
