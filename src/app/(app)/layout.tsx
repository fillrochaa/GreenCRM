import { Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/auth";

/** Área logada do CRM. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <>
      <Sidebar userEmail={user.email} />
      <main className="min-h-dvh pl-[72px]">{children}</main>
    </>
  );
}
