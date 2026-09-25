"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Globe,
  Share2,
  Save,
  CheckCircle,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import {
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/AdminUI";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [defaultTitle, setDefaultTitle] = useState("");
  const [titleTemplate, setTitleTemplate] = useState("");
  const [defaultMetaDescription, setDefaultMetaDescription] = useState("");
  const [robots, setRobots] = useState("index, follow");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((resData) => {
        const s = resData.data?.settings;
        if (s) {
          setSiteName(s.siteName || "");
          setSiteUrl(s.siteUrl || "");
          setDefaultTitle(s.defaultTitle || "");
          setTitleTemplate(s.titleTemplate || "");
          setDefaultMetaDescription(s.defaultMetaDescription || "");
          setRobots(s.robots || "index, follow");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load settings:", err);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: siteName.trim(),
          siteUrl: siteUrl.trim(),
          defaultTitle: defaultTitle.trim(),
          titleTemplate: titleTemplate.trim(),
          defaultMetaDescription: defaultMetaDescription.trim(),
          robots: robots.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update settings");
      }

      setSuccessMsg("System & SEO settings saved successfully.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Save operation failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-sunflower-100/30 border-t-sunflower-100 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-white-chalk-100/50">Loading marketplace settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <AdminPageHeader
        title="Platform & SEO Settings"
        description="Global metadata, site branding, crawler indexing guidelines, and environment configuration."
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Administration" },
          { label: "Settings" },
        ]}
      />

      {successMsg && (
        <div className="p-4 rounded-xl bg-pablano-100/15 border border-pablano-100/30 text-pablano-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-cadmium-red-100/15 border border-cadmium-red-100/30 text-cadmium-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Marketplace Identity Card */}
        <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
            <Globe className="w-4 h-4 text-sunflower-100" />
            <h3 className="font-sora text-sm font-bold text-white-chalk-100">
              Marketplace Identity & Domain
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Marketplace Name
              </label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="iShopping Marketplace"
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Primary Storefront URL
              </label>
              <input
                type="url"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://ishopping.pk"
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Global SEO & Social Graph */}
        <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
            <Share2 className="w-4 h-4 text-munsell-blue-100" />
            <h3 className="font-sora text-sm font-bold text-white-chalk-100">
              Default SEO & Metadata
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Default Meta Title
              </label>
              <input
                type="text"
                value={defaultTitle}
                onChange={(e) => setDefaultTitle(e.target.value)}
                placeholder="Online Shopping in Pakistan"
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Title Template Pattern
              </label>
              <input
                type="text"
                value={titleTemplate}
                onChange={(e) => setTitleTemplate(e.target.value)}
                placeholder="%s | iShopping.pk"
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
              Default Meta Description
            </label>
            <textarea
              value={defaultMetaDescription}
              onChange={(e) => setDefaultMetaDescription(e.target.value)}
              placeholder="Shop thousands of products across electronics, fashion, mobile devices, and lifestyle with fast home delivery and warranty."
              rows={3}
              className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl p-3 text-xs text-white-chalk-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
              Search Engine Crawler Rules (Robots)
            </label>
            <input
              type="text"
              value={robots}
              onChange={(e) => setRobots(e.target.value)}
              placeholder="index, follow"
              className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none font-mono"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition disabled:opacity-40 cursor-pointer shadow-lg shadow-sunflower-100/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Changes..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
