"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";

type Attribute = {
  id: string;
  name: string;
  code: string;
  type: string;
  scope: string;
  isRequired: boolean;
};

export default function AttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/attributes")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setAttributes(data.data);
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-matt-black-100">Attributes</h2>
          <p className="text-sm text-matt-black-300 mt-1">Manage product and variant attributes</p>
        </div>
        <Link 
          href="/admin/catalogue/attributes/new"
          className="bg-munsell-blue-100 hover:bg-munsell-blue-200 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Attribute
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-matt-black-500/20 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white-chalk-100 border-b border-matt-black-500/20">
            <tr>
              <th className="px-6 py-4 font-semibold text-matt-black-200">Name</th>
              <th className="px-6 py-4 font-semibold text-matt-black-200">Code</th>
              <th className="px-6 py-4 font-semibold text-matt-black-200">Type</th>
              <th className="px-6 py-4 font-semibold text-matt-black-200">Scope</th>
              <th className="px-6 py-4 font-semibold text-matt-black-200 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-matt-black-500/10">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-matt-black-300">
                  Loading attributes...
                </td>
              </tr>
            ) : attributes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-matt-black-300">
                  No attributes found.
                </td>
              </tr>
            ) : (
              attributes.map((attr) => (
                <tr key={attr.id} className="hover:bg-white-chalk-100/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-matt-black-100">{attr.name}</td>
                  <td className="px-6 py-4 text-matt-black-300">{attr.code}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white-chalk-200 border border-matt-black-500/30 text-matt-black-200">
                      {attr.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-munsell-blue-500/50 text-munsell-blue-100">
                      {attr.scope}
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
