import {
  CreditCardIcon,
  HeadphonesIcon,
  ShieldCheckIcon,
  TruckIcon,
} from "lucide-react";

const items = [
  {
    icon: TruckIcon,
    title: "Fulfillment",
    desc: "Structured catalog & inventory-ready model",
  },
  {
    icon: ShieldCheckIcon,
    title: "Secure pay",
    desc: "Encrypted payments and order confirmation",
  },
  {
    icon: CreditCardIcon,
    title: "Transparent",
    desc: "Prices in USD, tax where applicable",
  },
  {
    icon: HeadphonesIcon,
    title: "Human support",
    desc: "Order-scoped chat + optional video",
  },
];

export function TrustStrip() {
  return (
    <section className="max-w-7xl mx-auto grid gap-4 rounded-box border border-base-300 bg-base- p-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const IconCmp = item.icon;
        return (
          <div key={item.title} className="flex gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center ronded-lg bg-primary/10 text-primary">
              <IconCmp className="size-5" aria-hidden />
            </div>
            <div>
              <h3 className="font-semibold text-base-content">{item.title}</h3>
              <p className="mt-0.5 text-sm text-base-content/65">{item.desc}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
