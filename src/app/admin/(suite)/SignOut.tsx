"use client";

import { useRouter } from "next/navigation";

export function SignOut() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn btn-ghost btn-small"
      onClick={async () => {
        await fetch("/api/v1/admin/session", { method: "DELETE" }).catch(() => {});
        router.push("/admin/login");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
