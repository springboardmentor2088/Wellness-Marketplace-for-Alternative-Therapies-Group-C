import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { getAllProducts } from "../services/productService";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

const ProductListPage = () => {
  const { itemCount } = useCart();
  const { wishlistIds, loadedOnce } = useWishlist();
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const response = await getAllProducts();
        if (isMounted) setProducts(response.data || []);
      } catch (err) {
        console.error("Error fetching products:", err);
        if (isMounted) setError("Failed to load products.");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Wellness Products</h1>
            <p className="mt-1 text-sm text-gray-600">
              Products are curated and sold by verified practitioners.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/community" className="text-sm text-emerald-700 hover:underline">
              Community Q&A
            </Link>
            <Link to="/wishlist" className="text-sm text-emerald-700 hover:underline">
              Wishlist ({loadedOnce ? wishlistIds.length : 0})
            </Link>
            <Link to="/cart" className="text-sm text-emerald-700 hover:underline">
              Cart ({itemCount})
            </Link>
          </div>
        </div>

        {loading && <p className="mt-6 text-gray-600">Loading products…</p>}
        {error && <p className="mt-6 text-red-600">{error}</p>}

        {!loading && !error && (
          <>
            <div className="mt-6 flex flex-wrap gap-2">
              {["All", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={
                    "rounded-xl px-4 py-2 text-sm font-semibold transition border " +
                    (selectedCategory === cat
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50")
                  }
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(selectedCategory === "All"
                ? products
                : products.filter((p) => p.category === selectedCategory)
              ).map((product) => (
              <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductListPage;
