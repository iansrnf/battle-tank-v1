import "./globals.css";

export const metadata = {
  title: "Battle Tank NES Style",
  description: "Retro battle tank game in Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}