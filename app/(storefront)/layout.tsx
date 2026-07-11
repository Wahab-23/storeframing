import React from "react";
import Header from "@/components/storefront/base/header/Header";
import Footer from "@/components/storefront/base/footer/Footer";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header />
      <main className="grow">{children}</main>
      <Footer />
    </div>
  );
}

