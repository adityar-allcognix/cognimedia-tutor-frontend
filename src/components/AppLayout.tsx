import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex w-full gradient-bg">
      <AppSidebar />
      <main className="flex-1 min-h-screen pb-20 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
