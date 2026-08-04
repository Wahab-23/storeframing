"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import BlockNoteEditor, { BlockNoteEditorRef } from "@/components/blocknote/blocknoteEditor";

export default function NewBrandPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const editorRef = useRef<BlockNoteEditorRef>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    let description = "";
    if (editorRef.current) {
      description = await editorRef.current.getContent();
    }

    try {
      const res = await fetch("/api/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description, isActive }),
      });

      if (res.ok) {
        router.push("/admin/catalogue/brands");
      } else {
        const error = await res.json();
        alert(error.message || "Failed to create brand");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/admin/catalogue/brands"
          className="p-2 text-matt-black-300 hover:text-matt-black-100 hover:bg-white-chalk-100 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-matt-black-100">Create New Brand</h2>
          <p className="text-sm text-matt-black-300 mt-1">Add a new brand to your catalogue</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-matt-black-500/20 p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-matt-black-100">Brand Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                  }
                }}
                className="w-full px-4 py-2 bg-white-chalk-100 border border-matt-black-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-munsell-blue-200"
                placeholder="e.g. Nike"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-matt-black-100">URL Slug *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-4 py-2 bg-white-chalk-100 border border-matt-black-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-munsell-blue-200"
                placeholder="e.g. nike"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-matt-black-100">Description</label>
            <div className="border border-matt-black-500/30 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-munsell-blue-200">
              <BlockNoteEditor ref={editorRef} />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-munsell-blue-100 focus:ring-munsell-blue-200 border-matt-black-500/50 rounded cursor-pointer"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-matt-black-100 cursor-pointer">
              Active (visible to customers and sellers)
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/admin/catalogue/brands"
            className="px-6 py-2.5 text-sm font-semibold text-matt-black-200 bg-white border border-matt-black-500/30 rounded-lg hover:bg-white-chalk-100 transition-colors cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-munsell-blue-100 rounded-lg hover:bg-munsell-blue-200 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : "Save Brand"}
          </button>
        </div>
      </form>
    </div>
  );
}
