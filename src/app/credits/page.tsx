import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";
import { assetRecordSchema } from "@/modules/assets/register";
import register from "../../../assets/asset-register.json";

export const metadata: Metadata = { title: "Credits" };

/** Generated from assets/asset-register.json so credits can never drift from the rights record. */
export default function CreditsPage() {
  const assets = register.assets.map((a) => assetRecordSchema.parse(a));
  const credited = assets.filter((a) => a.credit_required && a.credit_text);
  const original = assets.filter((a) => a.source_collection === "original-procedural");
  return (
    <ContentPage title="Credits">
      <h2>Original game art</h2>
      <p>
        The scene, courier, HUD and share art are original procedural artwork authored in the WARTRACE codebase ({original.length} registered assets). They are
        not historical photographs and do not reproduce any specific battlefield.
      </p>
      <h2>Typefaces</h2>
      <ul>
        {assets
          .filter((a) => a.asset_type === "font")
          .map((a) => (
            <li key={a.asset_id}>
              {a.title} — {a.license_id}
              {a.license_url && (
                <>
                  {" "}
                  (
                  <a href={a.license_url} target="_blank" rel="noopener noreferrer">
                    license
                  </a>
                  )
                </>
              )}
            </li>
          ))}
      </ul>
      {credited.length > 0 && (
        <>
          <h2>Attributions</h2>
          <ul>
            {credited.map((a) => (
              <li key={a.asset_id}>{a.credit_text}</li>
            ))}
          </ul>
        </>
      )}
      <h2>Question sources</h2>
      <p>Sources for each answer are listed in-game after you lock, and on evidence pages.</p>
    </ContentPage>
  );
}
