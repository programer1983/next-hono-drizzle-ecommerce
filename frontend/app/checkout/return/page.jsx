"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle2Icon, ShoppingBagIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, Suspense } from "react";
import { useCart } from "@/hooks/useCart";

function CheckoutReturnContent() {
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get("checkout_id");
  const clear = useCart((s) => s.clear || (() => {}));

  useEffect(() => {
    if (typeof clear === "function") {
      clear();
    }
  }, [clear]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      <div className="card max-w-md border border-base-300 bg-base-100 p-8 shadow-sm">
        <figure className="mb-4 flex justify-center text-success">
          <CheckCircle2Icon className="size-16 animate-bounce" />
        </figure>

        <h1 className="text-2xl font-bold text-base-content">
          Order Placed Successfully!
        </h1>

        <p className="mt-2 text-sm text-base-content/70">
          Thank you for your purchase. Your mock checkout session was processed
          in test mode.
        </p>

        {checkoutId && (
          <div className="mt-4 rounded-box bg-base-200 p-3 text-xs font-mono text-base-content/80">
            ID: {checkoutId}
          </div>
        )}

        <div className="card-actions mt-6 justify-center">
          <Link href="/" className="btn btn-primary gap-2">
            <ShoppingBagIcon className="size-4" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      }
    >
      <CheckoutReturnContent />
    </Suspense>
  );
}
