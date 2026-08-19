import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MoneyAssist 2.0 - AI Personal Finance Assistant',
  description:
    'Kelola keuangan pribadi dengan kecerdasan buatan, Supabase, Gemini Vision OCR struk, dan audit finansial otomatis.',
  keywords: ['moneyassist', 'finance', 'ai', 'supabase', 'gemini', 'keuangan pribadi', 'budget tracker'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased min-h-screen selection:bg-emerald-500/30 selection:text-emerald-300">
        {children}
      </body>
    </html>
  );
}
