import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/ContentPage";

export const metadata: Metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <ContentPage title="Support" draft>
      <ul>
        <li>
          <strong>Wrong answer judgement?</strong> Use the appeal link on the round in your game or <Link href="/">result ledger</Link>.
        </li>
        <li>
          <strong>Lost progress?</strong> Runs are tied to the browser that started them. Clearing cookies or switching device starts a new guest session.
        </li>
        <li>
          <strong>Privacy or deletion requests, bugs and accessibility barriers:</strong> a support contact address will be published before launch.
        </li>
      </ul>
    </ContentPage>
  );
}
