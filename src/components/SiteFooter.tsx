import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link href="/about">About &amp; sources</Link>
      <Link href="/archive">Archive</Link>
      <Link href="/accessibility">Accessibility</Link>
      <Link href="/privacy">Privacy</Link>
      <Link href="/terms">Terms</Link>
      <Link href="/support">Support</Link>
      <Link href="/credits">Credits</Link>
      <span>WARTRACE gameplay art is original. Working title; not an affiliated brand.</span>
    </footer>
  );
}

export function PageHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="page-header">
      <Link href="/" className="brand">
        WARTRACE
      </Link>
      {children}
    </header>
  );
}

export function DemoBanner() {
  return (
    <div className="demo-banner" role="note">
      DEMO CONTENT — candidate questions awaiting historian review. Not a published WARTRACE operation.
    </div>
  );
}
