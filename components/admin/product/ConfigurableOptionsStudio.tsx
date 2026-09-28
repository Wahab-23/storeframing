"use client";

import React, { useState } from "react";
import {
  Boxes,
  Tag,
  Sliders,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ConfigurableOptionState, VariantItem } from "./ProductTypes";

export interface ConfigurableOptionsStudioProps {
  productId?: string;
  options: ConfigurableOptionState[];
  setOptions: React.Dispatch<React.SetStateAction<ConfigurableOptionState[]>>;
  variants: VariantItem[];
  setVariants: React.Dispatch<React.SetStateAction<VariantItem[]>>;
  onOptionChangeProductType?: (type: string) => void;
  onSuccessMsg?: (msg: string) => void;
  onErrorMsg?: (msg: string) => void;
  disabled?: boolean;
}

export function ConfigurableOptionsStudio({
  productId,
  options,
  setOptions,
  variants,
  setVariants,
  onOptionChangeProductType,
  onSuccessMsg,
  onErrorMsg,
  disabled = false,
}: ConfigurableOptionsStudioProps) {
  const [generatingMatrix, setGeneratingMatrix] = useState(false);

  const addPresetOption = (presetType: "COLOR" | "STORAGE" | "SIZE" | "WARRANTY") => {
    if (presetType === "COLOR") {
      setOptions((prev) => [
        ...prev,
        {
          name: "Color",
          code: "color",
          type: "COLOR_SWATCH",
          isRequired: true,
          values: [
            { label: "Space Gray", value: "space-gray", swatchValue: "#374151" },
            { label: "Silver", value: "silver", swatchValue: "#E2E8F0" },
            { label: "Midnight Blue", value: "midnight-blue", swatchValue: "#1E293B" },
          ],
        },
      ]);
    } else if (presetType === "STORAGE") {
      setOptions((prev) => [
        ...prev,
        {
          name: "Storage Capacity",
          code: "storage",
          type: "BUTTON_TILES",
          isRequired: true,
          values: [
            { label: "128 GB", value: "128gb", priceDelta: 0 },
            { label: "256 GB", value: "256gb", priceDelta: 100 },
            { label: "512 GB", value: "512gb", priceDelta: 250 },
          ],
        },
      ]);
    } else if (presetType === "SIZE") {
      setOptions((prev) => [
        ...prev,
        {
          name: "Size",
          code: "size",
          type: "BUTTON_TILES",
          isRequired: true,
          values: [
            { label: "Small", value: "small" },
            { label: "Medium", value: "medium" },
            { label: "Large", value: "large" },
          ],
        },
      ]);
    } else if (presetType === "WARRANTY") {
      setOptions((prev) => [
        ...prev,
        {
          name: "Warranty Protection",
          code: "warranty",
          type: "RADIO_CARDS",
          isRequired: false,
          values: [
            { label: "Standard 1-Year", value: "1yr", priceDelta: 0 },
            { label: "2-Year Care Protection", value: "2yr", priceDelta: 49 },
            { label: "3-Year Total Coverage", value: "3yr", priceDelta: 99 },
          ],
        },
      ]);
    }
    if (onOptionChangeProductType) onOptionChangeProductType("CONFIGURABLE");
  };

  const handleGenerateMatrix = async () => {
    if (options.length === 0) {
      if (onErrorMsg) onErrorMsg("Add at least one configurable option first.");
      return;
    }

    // Client-side cartesian generator fallback or backend trigger
    setGeneratingMatrix(true);
    try {
      if (productId) {
        const res = await fetch(`/api/admin/products/${productId}/generate-variants`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to generate matrix variants.");
        if (Array.isArray(data.data)) {
          setVariants(
            data.data.map((v: any) => ({
              id: v.id,
              name: v.name,
              sku: v.sku,
            }))
          );
        }
      } else {
        // Client side generation for unsaved products
        const optionArrays = options.map((opt) => opt.values.filter((v) => v.label.trim()));
        if (optionArrays.some((arr) => arr.length === 0)) {
          throw new Error("Each option must have at least one value with a label.");
        }

        const combinations = optionArrays.reduce<any[][]>(
          (acc, curr) => acc.flatMap((d) => curr.map((e) => [...d, e])),
          [[]]
        );

        const generated: VariantItem[] = combinations.map((combo, idx) => ({
          name: combo.map((v: any) => v.label).join(" / "),
          sku: `SKU-${combo.map((v: any) => v.value.toUpperCase().replace(/[^A-Z0-9]/g, "")).join("-") || idx + 1}`,
        }));
        setVariants(generated);
      }

      if (onOptionChangeProductType) onOptionChangeProductType("CONFIGURABLE");
      if (onSuccessMsg) onSuccessMsg(`Successfully generated matrix variant combinations!`);
    } catch (err: any) {
      if (onErrorMsg) onErrorMsg(err.message || "Error generating matrix variants.");
    } finally {
      setGeneratingMatrix(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white-chalk-100/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-sunflower-100" />
            <h3 className="font-sora text-base font-bold text-white-chalk-100">
              Magento-Style Configurable Options & Variant Studio
            </h3>
          </div>
          <p className="text-xs text-white-chalk-100/50 mt-1">
            Define customer-selectable swatches (Color, Storage, Size, Warranty) and generate SKU combinations with price deltas.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={generatingMatrix || options.length === 0 || disabled}
            onClick={handleGenerateMatrix}
            className="bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-100/90 font-bold shadow-md shadow-sunflower-100/10 cursor-pointer"
          >
            {generatingMatrix ? (
              <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-1.5 text-matt-black-100" />
            )}
            {generatingMatrix ? "Generating Combinations..." : "⚡ Generate Matrix Variants"}
          </Button>
        </div>
      </div>

      {/* Quick Presets Bar */}
      <div className="p-4 rounded-xl bg-matt-black-200/40 border border-white-chalk-100/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white-chalk-100 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-sunflower-100" />
            Quick Add Configurable Presets
          </span>
          <span className="text-[11px] text-white-chalk-100/40">
            Click to add instant swatch configurations
          </span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            disabled={disabled}
            onClick={() => addPresetOption("COLOR")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white-chalk-100/10 hover:bg-white-chalk-100/20 text-white-chalk-100 border border-white-chalk-100/10 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500" />
            🎨 Color Swatches
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => addPresetOption("STORAGE")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white-chalk-100/10 hover:bg-white-chalk-100/20 text-white-chalk-100 border border-white-chalk-100/10 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            💾 Storage Capacity
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => addPresetOption("SIZE")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white-chalk-100/10 hover:bg-white-chalk-100/20 text-white-chalk-100 border border-white-chalk-100/10 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            📏 Size / Dimension
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => addPresetOption("WARRANTY")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white-chalk-100/10 hover:bg-white-chalk-100/20 text-white-chalk-100 border border-white-chalk-100/10 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            🛡️ Extended Warranty
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setOptions((prev) => [
                ...prev,
                {
                  name: "New Option",
                  code: `option_${prev.length + 1}`,
                  type: "BUTTON_TILES",
                  isRequired: true,
                  values: [{ label: "Option 1", value: "option-1" }],
                },
              ]);
              if (onOptionChangeProductType) onOptionChangeProductType("CONFIGURABLE");
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-sunflower-100/15 text-sunflower-100 hover:bg-sunflower-100/25 border border-sunflower-100/30 transition flex items-center gap-1 cursor-pointer ml-auto disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Custom Option
          </button>
        </div>
      </div>

      {/* Configurable Options Cards */}
      {options.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-white-chalk-100/15 rounded-xl bg-matt-black-200/20 space-y-3">
          <Sliders className="w-10 h-10 text-white-chalk-100/20 mx-auto" />
          <div>
            <p className="text-xs font-semibold text-white-chalk-100">
              No Configurable Options defined yet.
            </p>
            <p className="text-[11px] text-white-chalk-100/40 mt-1 max-w-md mx-auto">
              Add swatches for Color, Storage, Size, or Warranty to create interactive selectors for storefront customers.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {options.map((opt, optIdx) => (
            <div
              key={optIdx}
              className="p-5 rounded-xl border border-white-chalk-100/10 bg-matt-black-200/40 space-y-4 relative"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end border-b border-white-chalk-100/10 pb-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Option Name</Label>
                  <Input
                    type="text"
                    disabled={disabled}
                    value={opt.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setOptions((prev) =>
                        prev.map((item, i) =>
                          i === optIdx
                            ? {
                                ...item,
                                name: val,
                                code: val.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
                              }
                            : item
                        )
                      );
                    }}
                    placeholder="e.g. Color, Storage"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">Code Key</Label>
                  <Input
                    type="text"
                    disabled={disabled}
                    value={opt.code}
                    onChange={(e) => {
                      const val = e.target.value;
                      setOptions((prev) =>
                        prev.map((item, i) => (i === optIdx ? { ...item, code: val } : item))
                      );
                    }}
                    placeholder="e.g. color, storage"
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">Selector Display Type</Label>
                  <select
                    disabled={disabled}
                    value={opt.type}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setOptions((prev) =>
                        prev.map((item, i) => (i === optIdx ? { ...item, type: val } : item))
                      );
                    }}
                    className="w-full h-9 bg-matt-black-300 border border-white-chalk-100/10 rounded-md px-3 text-xs text-white-chalk-100 font-semibold outline-none focus:border-sunflower-100/50"
                  >
                    <option value="COLOR_SWATCH">🎨 Visual Color Swatches (#Hex)</option>
                    <option value="IMAGE_SWATCH">🖼️ Image Swatches (Thumbnails)</option>
                    <option value="BUTTON_TILES">🔘 Button Pills / Tiles (128GB, S, M)</option>
                    <option value="DROPDOWN">📜 Dropdown Select Menu</option>
                    <option value="RADIO_CARDS">📻 Radio Cards with Subtext</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pb-1">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setOptions((prev) => prev.filter((_, i) => i !== optIdx));
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-cadmium-red-100/15 hover:bg-cadmium-red-100/25 text-cadmium-red-200 border border-cadmium-red-100/30 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Option
                  </button>
                </div>
              </div>

              {/* Values Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-white-chalk-100/70 font-semibold">
                  <span>Option Values & Swatches ({opt.values.length})</span>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setOptions((prev) =>
                        prev.map((item, i) =>
                          i === optIdx
                            ? {
                                ...item,
                                values: [
                                  ...item.values,
                                  {
                                    label: `Value ${item.values.length + 1}`,
                                    value: `val-${item.values.length + 1}`,
                                    swatchValue: opt.type === "COLOR_SWATCH" ? "#3B82F6" : "",
                                  },
                                ],
                              }
                            : item
                        )
                      );
                    }}
                    className="text-[11px] text-sunflower-100 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3" /> Add Value
                  </button>
                </div>

                <div className="space-y-2">
                  {opt.values.map((v, valIdx) => (
                    <div
                      key={valIdx}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-matt-black-300/60 p-2.5 rounded-lg border border-white-chalk-100/5 text-xs"
                    >
                      {/* Swatch visual preview if COLOR_SWATCH */}
                      {opt.type === "COLOR_SWATCH" && (
                        <div className="sm:col-span-1 flex items-center justify-center">
                          <div
                            className="w-6 h-6 rounded-full border border-white/20 shadow"
                            style={{ backgroundColor: v.swatchValue || "#334155" }}
                          />
                        </div>
                      )}

                      <div className={opt.type === "COLOR_SWATCH" ? "sm:col-span-3" : "sm:col-span-4"}>
                        <Input
                          type="text"
                          disabled={disabled}
                          placeholder="Label (e.g. Space Gray)"
                          value={v.label}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOptions((prev) =>
                              prev.map((item, i) =>
                                i === optIdx
                                  ? {
                                      ...item,
                                      values: item.values.map((vItem, vI) =>
                                        vI === valIdx
                                          ? {
                                              ...vItem,
                                              label: val,
                                              value: val.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                                            }
                                          : vItem
                                      ),
                                    }
                                  : item
                              )
                            );
                          }}
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <Input
                          type="text"
                          disabled={disabled}
                          placeholder="Value Code"
                          value={v.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOptions((prev) =>
                              prev.map((item, i) =>
                                i === optIdx
                                  ? {
                                      ...item,
                                      values: item.values.map((vItem, vI) =>
                                        vI === valIdx ? { ...vItem, value: val } : vItem
                                      ),
                                    }
                                  : item
                              )
                            );
                          }}
                          className="h-8 text-xs font-mono"
                        />
                      </div>

                      {(opt.type === "COLOR_SWATCH" || opt.type === "IMAGE_SWATCH") && (
                        <div className="sm:col-span-2">
                          <Input
                            type="text"
                            disabled={disabled}
                            placeholder={opt.type === "COLOR_SWATCH" ? "#HEX Code" : "Image URL"}
                            value={v.swatchValue || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOptions((prev) =>
                                prev.map((item, i) =>
                                  i === optIdx
                                    ? {
                                        ...item,
                                        values: item.values.map((vItem, vI) =>
                                          vI === valIdx ? { ...vItem, swatchValue: val } : vItem
                                        ),
                                      }
                                    : item
                                )
                              );
                            }}
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      )}

                      <div className={opt.type === "COLOR_SWATCH" || opt.type === "IMAGE_SWATCH" ? "sm:col-span-2" : "sm:col-span-4"}>
                        <Input
                          type="number"
                          disabled={disabled}
                          placeholder="Price Delta (+/-)"
                          value={v.priceDelta !== undefined ? String(v.priceDelta) : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOptions((prev) =>
                              prev.map((item, i) =>
                                i === optIdx
                                  ? {
                                      ...item,
                                      values: item.values.map((vItem, vI) =>
                                        vI === valIdx ? { ...vItem, priceDelta: val } : vItem
                                      ),
                                    }
                                  : item
                              )
                            );
                          }}
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="sm:col-span-1 flex items-center justify-end">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            setOptions((prev) =>
                              prev.map((item, i) =>
                                i === optIdx
                                  ? { ...item, values: item.values.filter((_, vI) => vI !== valIdx) }
                                  : item
                              )
                            );
                          }}
                          className="p-1 rounded text-cadmium-red-200 hover:bg-cadmium-red-100/15 cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Variants Matrix Table */}
      <div className="space-y-3 pt-4 border-t border-white-chalk-100/10">
        <div className="flex items-center justify-between">
          <h4 className="font-sora text-sm font-bold text-white-chalk-100 flex items-center gap-2">
            <Boxes className="w-4 h-4 text-sunflower-100" />
            Generated Variant SKUs ({variants.length})
          </h4>
        </div>

        {variants.length === 0 ? (
          <div className="text-center py-6 text-white-chalk-100/40 text-xs bg-matt-black-200/20 rounded-xl border border-white-chalk-100/5">
            No variants generated yet. Click &quot;⚡ Generate Matrix Variants&quot; above to auto-create variant combinations.
          </div>
        ) : (
          <div className="overflow-x-auto border border-white-chalk-100/10 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-matt-black-200/60 text-white-chalk-100/40 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Variant Combination Name</th>
                  <th className="py-2.5 px-3">Child SKU</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white-chalk-100/5">
                {variants.map((v, idx) => (
                  <tr key={idx} className="hover:bg-white-chalk-100/5">
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        disabled={disabled}
                        value={v.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariants((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, name: val } : item))
                          );
                        }}
                        className="bg-transparent text-white-chalk-100 font-semibold border-b border-white-chalk-100/10 focus:border-sunflower-100/50 outline-none px-1 py-0.5 w-full"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        disabled={disabled}
                        value={v.sku}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVariants((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, sku: val } : item))
                          );
                        }}
                        className="bg-transparent font-mono text-white-chalk-100/80 border-b border-white-chalk-100/10 focus:border-sunflower-100/50 outline-none px-1 py-0.5 w-full"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          setVariants((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="p-1 rounded text-cadmium-red-200 hover:bg-cadmium-red-100/15 cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
