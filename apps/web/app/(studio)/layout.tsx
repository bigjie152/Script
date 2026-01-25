import Sidebar from "../../ui/aistudio/main/components/layout/Sidebar";
import Header from "../../ui/aistudio/main/components/layout/Header";

export default function StudioLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#F9FAFB] font-sans text-gray-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 h-screen">
        <Header />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
