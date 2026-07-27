import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { QuotationBuilder, QuotationSuccess } from "@/components/quotation/QuotationBuilder";
import { useStore } from "@/lib/store";
import type { Quotation } from "@/data/types";

const searchSchema = z.object({ productId: z.string().optional() });

export const Route = createFileRoute("/quotation")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Request a Quotation — MegaHaus" },
      { name: "description", content: "Get a custom quote on multiple products in one request. Our team responds within 24 hours with CIF pricing." },
      { property: "og:title", content: "Request a Quotation — MegaHaus" },
      { property: "og:description", content: "Get a custom quote on multiple products in one request." },
    ],
  }),
  component: QuotationPage,
});

function QuotationPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isAgent, isPartner } = useStore();
  const [submitted, setSubmitted] = useState<Quotation | null>(null);

  // Logged-in customers should use their portal version
  useEffect(() => {
    if (isAuthenticated && !isAdmin && !isAgent && !isPartner) {
      navigate({ to: "/portal-customer/quotation", search: search.productId ? { productId: search.productId } : {} });
    }
  }, [isAuthenticated, isAdmin, isAgent, isPartner, navigate, search.productId]);

  if (isAuthenticated && !isAdmin && !isAgent && !isPartner) return null;

  return (
    <PublicLayout>
      <div className="border-b border-border bg-secondary">
        <div className="container mx-auto px-4 py-10">
          <div className="text-xs text-muted-foreground">Home / Request Quotation</div>
          <h1 className="mt-2 font-display text-4xl font-bold">Request a Quotation</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Add one or more products to your RFQ, cart-style. Our procurement team will respond with a consolidated quote within 24 hours.</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-10">
        {submitted ? (
          <QuotationSuccess rfq={submitted} browseHref="/products" listHref="/auth/login" />
        ) : (
          <QuotationBuilder initialProductId={search.productId} onSubmitted={setSubmitted} />
        )}
      </div>
    </PublicLayout>
  );
}
