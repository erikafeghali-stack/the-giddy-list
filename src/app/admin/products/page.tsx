"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Product, AgeRange, CollectionCategory } from "@/lib/types";

export default function AdminProductsPage() {
  const searchParams = useSearchParams();
  const showAdd = searchParams.get("add") === "true";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [showAddModal, setShowAddModal] = useState(showAdd);
  const [adding, setAdding] = useState(false);

  // Filter state
  const [filterCategory, setFilterCategory] = useState<CollectionCategory | "">("");
  const [filterAge, setFilterAge] = useState<AgeRange | "">("");

  // Add product form
  const [productUrl, setProductUrl] = useState("");
  const [productAgeRange, setProductAgeRange] = useState<AgeRange | "">("");
  const [productCategory, setProductCategory] = useState<CollectionCategory | "">("");
  const [productBrand, setProductBrand] = useState("");

  const limit = 20;

  useEffect(() => {
    loadProducts();
  }, [page, filterCategory, filterAge]);

  async function loadProducts() {
    setLoading(true);

    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;

    const params = new URLSearchParams();
    params.set("limit", limit.toString());
    params.set("offset", (page * limit).toString());
    if (filterCategory) params.set("category", filterCategory);
    if (filterAge) params.set("age_range", filterAge);

    const response = await fetch(`/api/products?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    setProducts(data.products || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  async function handleAddProduct() {
    if (!productUrl) {
      alert("Please enter a product URL");
      return;
    }

    setAdding(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      const response = await fetch("/api/products/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: productUrl,
          age_range: productAgeRange || undefined,
          category: productCategory || undefined,
          brand: productBrand || undefined,
        }),
      });

      const data = await response.json();

      if (data.product) {
        alert(`Product ${data.action}: ${data.product.title}`);
        setShowAddModal(false);
        setProductUrl("");
        setProductAgeRange("");
        setProductCategory("");
        setProductBrand("");
        loadProducts();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("Failed to add product");
    } finally {
      setAdding(false);
    }
  }

  async function handleDeactivate(productId: string) {
    if (!confirm("Are you sure you want to deactivate this product?")) return;

    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;

    const response = await fetch(`/api/products?id=${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      loadProducts();
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-red px-4 py-2 text-sm font-medium text-white hover:bg-red-hover transition-colors"
        >
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value as CollectionCategory | "");
            setPage(0);
          }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
        >
          <option value="">All Categories</option>
          <option value="toys">Toys</option>
          <option value="books">Books</option>
          <option value="clothing">Clothing</option>
          <option value="gear">Gear</option>
          <option value="outdoor">Outdoor</option>
          <option value="arts-crafts">Arts & Crafts</option>
          <option value="electronics">Electronics</option>
          <option value="sports">Sports</option>
        </select>

        <select
          value={filterAge}
          onChange={(e) => {
            setFilterAge(e.target.value as AgeRange | "");
            setPage(0);
          }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
        >
          <option value="">All Ages</option>
          <option value="0-2">0-2 years</option>
          <option value="3-5">3-5 years</option>
          <option value="6-8">6-8 years</option>
          <option value="9-12">9-12 years</option>
          <option value="13-18">13-18 years</option>
        </select>

        <span className="ml-auto text-sm text-foreground/50 self-center">
          {total} products
        </span>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-red/20 border-t-red rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center border border-gray-100">
          <p className="text-foreground/50">No products found</p>
        </div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground/50 uppercase">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground/50 uppercase">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground/50 uppercase">
                    Age
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground/50 uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-foreground/50 uppercase">
                    Retailer
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-foreground/50 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt=""
                            className="w-10 h-10 object-contain bg-gray-50 rounded"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-foreground text-sm line-clamp-1">
                            {product.title}
                          </div>
                          {product.brand && (
                            <div className="text-xs text-foreground/50">
                              {product.brand}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {product.price ? `$${product.price}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground/70">
                      {product.age_range || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground/70 capitalize">
                      {product.category?.replace("-", " ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground/70 capitalize">
                      {product.retailer}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={product.original_url}
                          target="_blank"
                          className="rounded px-2 py-1 text-xs text-foreground/70 hover:bg-gray-100 transition-colors"
                        >
                          View
                        </a>
                        <button
                          onClick={() => handleDeactivate(product.id)}
                          className="rounded px-2 py-1 text-xs text-red hover:bg-red/10 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded px-3 py-1 text-sm text-foreground/70 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-foreground/50">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded px-3 py-1 text-sm text-foreground/70 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Add Product
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Product URL *
                </label>
                <input
                  type="url"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="https://www.amazon.com/dp/..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <p className="text-xs text-foreground/50 mt-1">
                  Paste an Amazon, Walmart, or Target product URL
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Age Range
                </label>
                <select
                  value={productAgeRange}
                  onChange={(e) => setProductAgeRange(e.target.value as AgeRange | "")}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">Select age range</option>
                  <option value="0-2">0-2 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="6-8">6-8 years</option>
                  <option value="9-12">9-12 years</option>
                  <option value="13-18">13-18 years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Category
                </label>
                <select
                  value={productCategory}
                  onChange={(e) =>
                    setProductCategory(e.target.value as CollectionCategory | "")
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">Select category</option>
                  <option value="toys">Toys</option>
                  <option value="books">Books</option>
                  <option value="clothing">Clothing</option>
                  <option value="gear">Gear</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="arts-crafts">Arts & Crafts</option>
                  <option value="electronics">Electronics</option>
                  <option value="sports">Sports</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Brand (optional)
                </label>
                <input
                  type="text"
                  value={productBrand}
                  onChange={(e) => setProductBrand(e.target.value)}
                  placeholder="Enter brand name"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                disabled={adding || !productUrl}
                className="flex-1 rounded-lg bg-red px-4 py-2.5 text-sm font-medium text-white hover:bg-red-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? "Adding..." : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
