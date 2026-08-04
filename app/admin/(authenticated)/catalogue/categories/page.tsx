"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.data && Array.isArray(data.data.categories)) {
          setCategories(data.data.categories);
        } else if (data.data && Array.isArray(data.data)) {
          setCategories(data.data);
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-matt-black-100">Categories</h2>
          <p className="text-sm text-matt-black-300 mt-1">Manage product categories</p>
        </div>
        <Link 
          href="/admin/catalogue/categories/new"
          className="bg-munsell-blue-100 hover:bg-munsell-blue-200 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-matt-black-500/20 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white-chalk-100 border-b border-matt-black-500/20">
            <tr>
              <th className="px-6 py-4 font-semibold text-matt-black-200">Name</th>
              <th className="px-6 py-4 font-semibold text-matt-black-200">Slug</th>
              <th className="px-6 py-4 font-semibold text-matt-black-200">Status</th>
              <th className="px-6 py-4 font-semibold text-matt-black-200 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-matt-black-500/10">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-matt-black-300">
                  Loading categories...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-matt-black-300">
                  No categories found.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="hover:bg-white-chalk-100/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-matt-black-100">{category.name}</td>
                  <td className="px-6 py-4 text-matt-black-300">{category.slug}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${category.isActive ? 'bg-pablano-500 text-pablano-100' : 'bg-matt-black-500 text-matt-black-200'}`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-matt-black-300 hover:text-munsell-blue-100 transition-colors cursor-pointer">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-matt-black-300 hover:text-cadmium-red-100 transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
