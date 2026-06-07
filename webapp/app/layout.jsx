import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Figtree } from "next/font/google";
import Providers from "./providers";
import { AsgardeoProvider } from "@asgardeo/nextjs/server";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata = {
  title: "Nomad Page",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${figtree.variable} font-sans antialiased`}>
        <AsgardeoProvider>
          <Providers>{children}</Providers>
        </AsgardeoProvider>
      </body>
    </html>
  );
}
