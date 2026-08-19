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
    <div className="flex min-h-screen bg-[#090d16] text-slate-100">
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <Sidebar userEmail={user?.email || null} />

      {/* Main Scrollable Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 pb-28 md:pb-12">{children}</main>
      </div>

      {/* Mobile Bottom Tab Bar & Drawer (Visible only on Mobile) */}
      <MobileNav userEmail={user?.email || null} />
    </div>
  );
}
