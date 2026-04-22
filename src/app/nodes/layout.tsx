import Sidebar from "@/components/layout/Sidebar";

export default function NodesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-[var(--bg-page)] text-[var(--text-primary)]">
      <Sidebar />
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-black z-30 border-b border-[#1a1a1a]" />
      <main className="flex-1 overflow-hidden flex flex-col relative w-full h-full pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
