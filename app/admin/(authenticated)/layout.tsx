import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { ReactNode } from "react";

export default function AdminAuthenticatedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0d1117" }}>
      <AdminSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader />
        <main
          className="flex-1 overflow-y-auto p-6 custom-scrollbar"
          style={{ background: "#0f1520" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
