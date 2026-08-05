import OrderLayout from "@/components/OrderLayout";

export default function OrderDetailLayout({ children, params }) {
  return <OrderLayout params={params}>{children}</OrderLayout>;
}
