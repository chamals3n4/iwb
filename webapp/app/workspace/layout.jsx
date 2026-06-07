import { AppSidebarServer } from "@/components/app-sidebar-server";
import { SiteHeaderServer } from "@/components/site-header-server";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function WorkspaceLayout({ children }) {
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <AppSidebarServer variant="inset" />
      <SidebarInset>
        <SiteHeaderServer />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
