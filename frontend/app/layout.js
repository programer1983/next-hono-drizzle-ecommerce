import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Providers from "@/lib/providers";

export const metadata = {
  title: "Next-Hono-Ecommerce",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full antialiased" data-theme="forest">
        <body className="min-h-full flex flex-col">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
