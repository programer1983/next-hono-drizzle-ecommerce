"use client";

import { apiFetch } from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import { Show, SignInButton, useAuth, UserButton } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import {
  LogInIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  StoreIcon,
} from "lucide-react";
import Link from "next/link";
import { HeaderSkeleton } from "./LoadingSkeletons";

const Navbar = () => {
  const { getToken, isSignedIn, isLoaded } = useAuth();

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch("/api/me", { getToken }),
    enabled: isSignedIn,
  });

  const role = meData?.user?.role;

  const cartCount = useCart((s) =>
    s.items.reduce((n, line) => n + line.quantity, 0),
  );

  if (!isLoaded) {
    return <HeaderSkeleton />;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-base-300 bg-base-100/95 shadow-sm backdrop-blur-md">
      <div className="navbar mx-auto max-w-7xl min-h-14 px-4 py-2.5 md:px-6 md:py-3">
        <div className="flex-1">
          <Link
            href="/"
            className="btn btn-ghost gap-2 px-2 font-mono text-lg font-semibold uppercase tracking-wide md:text-xl"
          >
            <span className="flex size-10 justify-center items-center rounded-lg bg-primary/15 p-1 text-primary">
              <StoreIcon className="size-8" aria-hidden />
            </span>
            <span className="leading-none">Northwind</span>
          </Link>
        </div>
        <nav className="flex items-center gap-1 md:gap-1.5">
          <Link href="/" className="btn btn-ghost gap-2 font-medium">
            <ShoppingBagIcon className="size-6 opacity-90" aria-hidden />
            <span className="hidden sm:inline">Shop</span>
          </Link>
          <Show when="signed-in">
            <Link href="/orders" className="btn btn-ghost gap-2 font-medium">
              <PackageIcon className="size-6 opacity-90" aria-hidden />
              <span className="hidden sm:inline">Orders</span>
            </Link>
            {role === "admin" ? (
              <Link
                href="/admin"
                className="btn btn-ghost gap-2 font-medium text-secondary"
              >
                <SettingsIcon className="size-6 opacity-90" aria-hidden />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            ) : null}
          </Show>
          <Link
            href="/cart"
            className="btn btn-ghost gap-2 font-medium indicator"
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
          >
            {cartCount > 0 ? (
              <span className="indicator-item badge badge-sm badge-primary min-w-2 px-1.5 font-sans text-xs tabular-nums">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
            <ShoppingCartIcon className="size-6 opacity-90" aria-hidden />
            <span className="hidden sm:inline">Cart</span>
          </Link>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="btn btn-primary btn-sm gap-1.5 px-3 shadow-md ml-10"
              >
                <LogInIcon className="size-4 drop-shadow-sm" aria-hidden />
                Sign In
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <div className="flex items-center gap-2 border-l border-base-300 pl-3">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: { width: "40px", height: "40px" },
                    avatarImage: {
                      borderRadius: "50%",
                      boxShadow: "0 0 0 2px var(--fallback-b3, hsl(var(--b3)))",
                    },
                  },
                }}
              />
              <span>
                {role === "support" || role === "admin" ? (
                  <span className="badge badge-primary badge-sm hidden capitalize md:inline-flex">
                    {role}
                  </span>
                ) : null}
              </span>
            </div>
          </Show>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
