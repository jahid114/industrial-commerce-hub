import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { QuotationBuilder, QuotationSuccess } from "@/components/quotation/QuotationBuilder";
import type { Quotation } from "@/data/types";

const searchSchema = z.object({ productId: z.string().optional() });

export const Route = createFileRoute("/portal-customer/quotation")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "New Quotation — Portal" }] }),
  component: PortalQuotationPage,
});

function PortalQuotationPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState<Quotation | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Request a Quotation</h1>
          <p className="text-sm text-muted-foreground">Build your RFQ like a cart — add multiple products, set targets, submit once.</p>
        </div>
        <button onClick={() => navigate({ to: "/portal-customer/quotations" })} className="text-sm text-primary hover:underline">← Back to my quotations</button>
      </div>
      {submitted ? (
        <div className="rounded-lg border border-border bg-card">
          <QuotationSuccess rfq={submitted} browseHref="/portal-customer/catalog" listHref="/portal-customer/quotations" />
        </div>
      ) : (
        <QuotationBuilder initialProductId={search.productId} onSubmitted={setSubmitted} />
      )}
    </div>
  );
}
