import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getWishlist, removeFromWishlist } from "../services/wishlistService";
import { useCart } from "../context/CartContext";
import { getProductImageSrc } from "../services/imageService";
import { logout } from "../services/authService";
import { useWishlist } from "../context/WishlistContext";

const WishlistPage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { refreshWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWishlist = async () => {
    try {
      const data = await getWishlist();
      setProducts(data);
      await refreshWishlist();
    } catch (err) {
      console.error(err);
      setError("Failed to load wishlist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      await refreshWishlist();
    } catch (err) {
      console.error("Failed to remove from wishlist", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar - Replicating Patient Dashboard Layout */}
      <aside className="w-64 bg-emerald-800 text-white p-6 space-y-1 flex flex-col hidden md:flex">
        <h2 className="text-2xl font-bold mb-4">WellnessHub</h2>
        <nav className="space-y-1 text-sm flex-1">
          <p onClick={() => navigate("/patient-dashboard")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">Dashboard</p>
          <p onClick={() => navigate("/practitioners")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">Browse Practitioners</p>
          <p onClick={() => navigate("/my-sessions")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">My Sessions</p>
          <p onClick={() => navigate("/products")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">Wellness Products</p>
          <p onClick={() => navigate("/community")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">Community Q&A</p>
          <p onClick={() => navigate("/my-orders")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">My Orders</p>
          <p className="px-3 py-2 bg-emerald-700 rounded-lg font-semibold cursor-pointer">Wishlist</p>
        </nav>
        <button onClick={handleLogout} className="mt-auto bg-emerald-700 px-4 py-2.5 rounded-xl hover:bg-emerald-600 transition font-semibold text-sm w-full">
          Logout
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Wishlist ❤️</h1>
            <p className="text-gray-500 mt-1">Saved items for later.</p>
          </div>
          <Link to="/products" className="text-emerald-600 hover:underline">
             Continue Shopping
          </Link>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <p className="text-gray-500 mb-4">Your wishlist is empty.</p>
            <Link to="/products" className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
               const imageUrl = getProductImageSrc(product);
               return (
                <div key={product.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col">
                    <div className="h-40 bg-gray-50 rounded-xl mb-4 overflow-hidden border border-gray-100 flex items-center justify-center">
                  <img src={imageUrl} alt={product.name} className="h-full w-full object-contain" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-emerald-700 font-semibold mb-3">₹{product.price}</p>
                    
                    <div className="mt-auto flex gap-2">
                        <button 
                            onClick={() => addToCart(product, 1)}
                            className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition"
                        >
                            Add to Cart
                        </button>
                        <button 
                            onClick={() => handleRemove(product.id)}
                            className="px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition"
                            title="Remove from Wishlist"
                        >
                            ✕
                        </button>
                    </div>
                </div>
               );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default WishlistPage;