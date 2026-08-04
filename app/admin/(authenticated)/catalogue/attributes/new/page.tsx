"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NewAttributePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState("TEXT");
  const [scope, setScope] = useState("PRODUCT");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          code, 
          type, 
          scope, 
          isRequired: false, 
          isFilterable: false, 
          isSearchable: false, 
          isVariant: false 
        }),
      });

      if (res.ok) {
        router.push("/admin/catalogue/attributes");
      } else {
        const error = await res.json();
        alert(error.message || "Failed to create attribute");
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
          href="/admin/catalogue/attributes"
          className="p-2 text-matt-black-300 hover:text-matt-black-100 hover:bg-white-chalk-100 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-matt-black-100">Create New Attribute</h2>
          <p className="text-sm text-matt-black-300 mt-1">Define an attribute for products or variants</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-matt-black-500/20 p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-matt-black-100">Attribute Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!code) {
                    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/(^_|_$)+/g, ''));
                  }
                }}
                className="w-full px-4 py-2 bg-white-chalk-100 border border-matt-black-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-munsell-blue-200"
                placeholder="e.g. Color"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-matt-black-100">Attribute Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-2 bg-white-chalk-100 border border-matt-black-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-munsell-blue-200"
                placeholder="e.g. COLOR"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-matt-black-100">Data Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2 bg-white-chalk-100 border border-matt-black-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-munsell-blue-200 cursor-pointer"
              >
                <option value="TEXT">Text</option>
                <option value="INTEGER">Integer</option>
                <option value="DECIMAL">Decimal</option>
                <option value="BOOLEAN">Boolean</option>
                <option value="SELECT">Select Dropdown</option>
                <option value="MULTI_SELECT">Multi Select</option>
                <option value="COLOR">Color</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-matt-black-100">Scope *</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full px-4 py-2 bg-white-chalk-100 border border-matt-black-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-munsell-blue-200 cursor-pointer"
              >
                <option value="PRODUCT">Product</option>
                <option value="VARIANT">Variant</option>
                <option value="LISTING">Listing</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/admin/catalogue/attributes"
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
            {loading ? "Saving..." : "Save Attribute"}
          </button>
        </div>
      </form>
    </div>
  );
}
