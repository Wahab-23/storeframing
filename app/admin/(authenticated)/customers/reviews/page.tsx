"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Star,
  Trash2,
  CheckCircle,
  AlertTriangle,
  User,
  Package,
} from "lucide-react";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminFilterBar,
  AdminTable,
} from "@/components/admin/AdminUI";

interface Review {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  createdAt: string;
  user?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  product?: {
    name: string;
    slug: string;
  } | null;
}

export default function CustomerReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/customers/reviews");
      const data = await res.json();
      if (Array.isArray(data.data)) {
        setReviews(data.data);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to remove this customer review?")) return;
    setDeletingId(reviewId);
    try {
      const res = await fetch(`/api/admin/customers/reviews?id=${reviewId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      }
    } catch (err) {
      console.error("Failed to delete review:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = reviews.filter((r) => {
    const q = search.toLowerCase();
    const comment = (r.comment || "").toLowerCase();
    const title = (r.title || "").toLowerCase();
    const prodName = (r.product?.name || "").toLowerCase();
    return comment.includes(q) || title.includes(q) || prodName.includes(q);
  });

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
          reviews.length
        ).toFixed(1)
      : "5.0";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customer Reviews Moderation"
        description="Monitor buyer product feedback, ratings sentiment, and moderate fraudulent or abusive content."
        badge={`${reviews.length} Public Reviews`}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Customers", href: "/admin/customers" },
          { label: "Reviews" },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard
          label="Total Reviews"
          value={reviews.length}
          subtext="Verified buyer submissions"
          icon={MessageSquare}
          variant="gold"
        />
        <AdminStatCard
          label="Platform Average Rating"
          value={`${averageRating} / 5.0`}
          subtext="Overall product sentiment"
          icon={Star}
          variant="green"
        />
        <AdminStatCard
          label="Content Integrity"
          value="Monitored"
          subtext="Spam & abuse detection active"
          icon={CheckCircle}
          variant="blue"
        />
      </div>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter by product name, comment keyword..."
        onRefresh={fetchReviews}
        isRefreshing={loading}
      />

      <AdminTable
        headers={[
          "Product",
          "Customer",
          "Rating",
          "Review Content",
          "Date",
          "Action",
        ]}
        loading={loading}
        isEmpty={filtered.length === 0}
        emptyMessage="No customer reviews found matching your filter."
        colSpan={6}
      >
        {filtered.map((review) => {
          const userText = review.user
            ? `${review.user.firstName || ""} ${review.user.lastName || ""}`.trim() || review.user.email
            : "Verified Customer";

          return (
            <tr
              key={review.id}
              className="hover:bg-white-chalk-100/5 transition-colors border-t border-white-chalk-100/5"
            >
              <td className="px-5 py-3.5 max-w-xs">
                <div className="font-semibold text-white-chalk-100 truncate">
                  {review.product?.name || "Product"}
                </div>
                <div className="text-[11px] text-white-chalk-100/40 font-mono">
                  ID: {review.id}
                </div>
              </td>

              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1.5 text-white-chalk-100 font-medium">
                  <User className="w-3.5 h-3.5 text-munsell-blue-100" />
                  <span>{userText}</span>
                </div>
              </td>

              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1 text-sunflower-100 font-bold font-mono">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{review.rating}.0</span>
                </div>
              </td>

              <td className="px-5 py-3.5 max-w-md">
                {review.title && (
                  <p className="font-bold text-white-chalk-100 text-xs">
                    {review.title}
                  </p>
                )}
                <p className="text-white-chalk-100/70 text-xs mt-0.5 line-clamp-2">
                  {review.comment || "No comment provided."}
                </p>
              </td>

              <td className="px-5 py-3.5 text-white-chalk-100/50 text-xs font-mono">
                {new Date(review.createdAt).toLocaleDateString()}
              </td>

              <td className="px-5 py-3.5 text-right">
                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={deletingId === review.id}
                  className="p-1.5 rounded-lg border border-white-chalk-100/10 hover:border-cadmium-red-100/40 text-white-chalk-100/60 hover:text-cadmium-red-200 transition cursor-pointer"
                  title="Delete Inappropriate Review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          );
        })}
      </AdminTable>
    </div>
  );
}
