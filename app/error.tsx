"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-16 md:px-6">
      <h1 className="font-heading text-4xl tracking-tight">The rate feed did not load</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        The National Bank request failed, and there is no saved series for this three-month window.
      </p>
      <div className="mt-6">
        <Button onClick={() => reset()}>Try again</Button>
      </div>
    </main>
  );
}
