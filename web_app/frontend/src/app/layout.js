import "./globals.css";

export const metadata = {
  title: "SAM 3 Vision Studio | Meta Segment Anything 3",
  description: "Next-generation open-vocabulary promptable image & video segmentation platform powered by Meta SAM 3",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] -z-10" />
        {children}
      </body>
    </html>
  );
}
