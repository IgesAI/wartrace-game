import { PageHeader, SiteFooter } from "./SiteFooter";

/** Static policy/info page. `draft` marks copy that needs owner/counsel review before public launch. */
export function ContentPage({ title, draft, children }: { title: string; draft?: boolean; children: React.ReactNode }) {
  return (
    <div className="page">
      <PageHeader />
      <main id="main" className="prose">
        <h1>{title}</h1>
        {draft && (
          <p className="draft-note">
            DRAFT — placeholder copy written for local development. It has not been reviewed by counsel and must not be published as-is.
          </p>
        )}
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
