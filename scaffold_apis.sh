#!/bin/bash
routes=(
  "brands"
  "attributes"
  "content/media"
  "listings"
  "buy-box"
  "inventory"
  "sellers/approvals"
  "sellers/verification"
  "sellers/performance"
  "sellers/staff"
  "customers"
  "customers/reviews"
  "customers/support-history"
  "support/conversations"
  "support/tickets"
  "support/disputes"
  "orders/seller-orders"
  "orders/payments"
  "orders/shipments"
  "orders/returns"
  "orders/refunds"
  "finance/commission-rules"
  "finance/earnings"
  "finance/wallets"
  "finance/wallet-transactions"
  "finance/withdrawals"
  "finance/payouts"
  "finance/reconciliation"
  "marketing/coupons"
  "marketing/promotions"
  "marketing/featured-products"
  "marketing/campaigns"
  "content/pages"
  "content/faqs"
  "content/navigation"
  "content/seo"
  "reports/exports"
  "roles"
  "permissions"
  "notifications"
  "integrations"
)

for route in "${routes[@]}"; do
  dir="app/api/admin/$route"
  if [ ! -f "$dir/route.ts" ]; then
    mkdir -p "$dir"
    cat << 'ROUTETEMPLATE' > "$dir/route.ts"
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

export async function POST(request: NextRequest) {
    return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
ROUTETEMPLATE
    echo "Created $dir/route.ts"
  fi
done
