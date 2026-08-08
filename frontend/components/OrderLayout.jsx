"use client";

import { OrderDetailSkeleton } from "@/components/LoadingSkeletons";
import PageError from "@/components/PageError";
import { OrderProvider } from "@/context/OrderContext";
import { useOrderDetailPage } from "@/hooks/useOrderDetailPage";
import { formatOrderWhen, formatPrice } from "@/utils/format";
import {
  ArrowLeftIcon,
  HeadphonesIcon,
  LayoutListIcon,
  LockIcon,
  MessageCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { use } from "react";

export default function OrderLayout({ children, params }) {
  const { id } = use(params);
  const pathname = usePathname();

  const { isLoading, error, order, items, paid } = useOrderDetailPage(id);

  if (isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (error || !order) {
    return (
      <PageError
        message="Order Not Found"
        action={{ to: "/orders", label: "Back to orders" }}
      />
    );
  }

  const summaryPath = `/orders/${id}`;
  const chatPath = `/orders/${id}/chat`;

  const getTabClass = (targetPath) => {
    const isActive = pathname === targetPath;
    return `tab gap-2 whitespace-nowrap ${isActive ? "tab-active" : ""}`;
  };

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto">
      <Link
        href="/orders"
        className="btn btn-sm btn-ghost gap-2 px-0 text-base-content/70 hover:text-primary"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        Back to orders
      </Link>
      <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-md">
        <div className="bg-linear-to-br from-primary/12 via-base-100 to-base-200/90 px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pb-4">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                  Order Details
                </p>
              </div>
              <h1 className="mt-1 font-mono text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
                #{order.id.slice(0, 8)}
              </h1>
              <div>
                <p className="mt-2 text-sm text-base-content/70">
                  {formatOrderWhen(order.createdAt, { dateStyle: "full" })}
                </p>
                <p className="mt-2 break-all font-mono text-sm text-base-content/45">
                  {order.id}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-base-300/80 pt-4 lg:border-t-0 lg:pt-0 lg:text-right">
              <span
                className={`badge badge-lg w-fit capitalize lg:ml-auto ${
                  paid
                    ? "badge-success"
                    : order.status === "pending"
                      ? "badge-warning"
                      : "badge-error"
                }`}
              >
                {order.status}
              </span>
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-base-content/50">
                  Order Total
                </p>
                <p className="font-mono text-2xl font-bold tracking-tight text-base-content sm:text-3xl">
                  {formatPrice(order.totalCents, "usd")}
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-base-300 py-4">
            <p className="max-w-3xl text-sm leading-relaxed text-base-content/80">
              Need help with shipping or returns? Open the{" "}
              <strong className="text-base-content">Support chat</strong> tab
              after payment. Video call links are shared in that thread;
              everyone joins with the same link.
            </p>
          </div>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 border-b border-base-300 pb-3">
          <HeadphonesIcon className="size-5 text-primary" aria-hidden />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-base-content">
            Customer Support
          </h2>
        </div>
        <div className="tabs tabs-box mt-3 w-fit flex-wrap bg-base-300/50 p-1">
          <Link href={summaryPath} className={getTabClass(summaryPath)}>
            <LayoutListIcon className="size-4 shrink-0" aria-hidden />
            Summary
          </Link>
          {paid ? (
            <Link href={chatPath} className={getTabClass(chatPath)}>
              <MessageCircleIcon className="size-4 shrink-0" aria-hidden />
              Support Chat
            </Link>
          ) : (
            <span className="tab tab-disabled gap-2 cursor-not-allowed opacity-50">
              <LockIcon className="size-4 shrink-0" aria-hidden />
              Support Chat
            </span>
          )}
        </div>
        {!paid ? (
          <div role="alert" className="alert alert-warning mt-4 text-sm">
            <LockIcon className="size-4 shrink-0" aria-hidden />
            <span>
              Support unlocks when this order is marked{" "}
              <strong className="text-base-content">paid</strong> (once payment
              is confirmed).
            </span>
          </div>
        ) : null}
        <div className="mt-5">
          <OrderProvider value={{ order, items, paid }}>
            {children}
          </OrderProvider>
        </div>
      </div>
    </div>
  );
}
