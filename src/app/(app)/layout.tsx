import { redirect } from "next/navigation";
import AppShell from "./AppShell";
import { getShop } from "@/lib/shop";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const shop = await getShop();
  if (!shop) redirect("/login");

  return (
    <AppShell shop={{ name: shop.name, state: shop.state, gstin: shop.gstin }}>
      {children}
    </AppShell>
  );
}
