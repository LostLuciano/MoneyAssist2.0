import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen bg-[#090d17] text-slate-100 antialiased selection:bg-emerald-500 selection:text-black">
      {/* Desktop Sidebar with macOS Window Frame */}
      <Sidebar userEmail={user?.email || null} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        <main className="flex-1 pb-28 md:pb-12 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* Mobile Bottom Dock (Floating on Mobile) */}
      <MobileNav userEmail={user?.email || null} />
    </div>
  );
}
