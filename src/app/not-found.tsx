import Link from "next/link";
import { ContentPage } from "@/components/ContentPage";

export default function NotFound() {
  return (
    <ContentPage title="Off the map">
      <p>We couldn&apos;t find that page. Shared result links stop working if the result was removed.</p>
      <p>
        <Link className="btn" href="/">
          Back to start
        </Link>
      </p>
    </ContentPage>
  );
}
