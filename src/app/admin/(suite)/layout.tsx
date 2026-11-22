import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/server/http";
import { SignOut } from "./SignOut";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Editorial", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  return (
    <div className="admin">
      <nav className="admin-nav" aria-label="Editorial">
        <strong className="brand" style={{ fontSize: "1rem" }}>
          WARTRACE · Editorial
        </strong>
        <Link href="/admin">Operations</Link>
        <Link href="/admin/questions">Questions</Link>
        <Link href="/admin/appeals">Appeals</Link>
        <Link href="/admin/audit">Audit log</Link>
        <span style={{ marginLeft: "auto" }} className="hint">
          {admin.displayName} · <span className="pill">{admin.role}</span>
        </span>
        <SignOut />
      </nav>
      <main id="main" className="admin-main">
        {children}
      </main>
    </div>
  );
}
