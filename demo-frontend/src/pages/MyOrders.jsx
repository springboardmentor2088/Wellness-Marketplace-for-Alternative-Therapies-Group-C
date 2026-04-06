import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import { deleteOrder, getOrders } from "../services/orderService";
import { getAllProducts } from "../services/productService";
import { format } from "date-fns";

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingOrderId, setDeletingOrderId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersResponse = await getOrders();
        const productsResponse = await getAllProducts();

        const productsMap = {};
        if (productsResponse && productsResponse.data) {
          productsResponse.data.forEach((p) => {
            productsMap[p.id] = p;
          });
        }

        setOrders(ordersResponse || []);
        setProducts(productsMap);
      } catch (err) {
        setError("Failed to load orders");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDeleteOrder = async (e, orderId) => {
    e.stopPropagation();
    setError("");

    const ok = window.confirm("Delete this order? This can’t be undone.");
    if (!ok) return;

    try {
      setDeletingOrderId(orderId);
      await deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
    } catch (err) {
      setError("Failed to delete order");
      console.error(err);
    } finally {
      setDeletingOrderId(null);
    }
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
      {/* Sidebar */}
      <aside className="w-64 bg-emerald-800 text-white p-6 space-y-1 flex flex-col">
        <h2 className="text-2xl font-bold mb-4">WellnessHub</h2>
        <nav className="space-y-1 text-sm flex-1">
          <p onClick={() => navigate("/patient-dashboard")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">Dashboard</p>
          <p onClick={() => navigate("/practitioners")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">Browse Practitioners</p>
          <p onClick={() => navigate("/my-sessions")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">My Sessions</p>
          <p onClick={() => navigate("/products")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">Wellness Products</p>
          <p onClick={() => navigate("/community")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">Community Q&A</p>
          <p className="px-3 py-2 bg-emerald-700 rounded-lg font-semibold cursor-pointer">My Orders</p>
          <p onClick={() => navigate("/wishlist")} className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition">Wishlist</p>
          <p className="px-3 py-2 hover:bg-emerald-700 rounded-lg cursor-pointer transition opacity-50">Profile</p>
        </nav>
        <button onClick={handleLogout} className="mt-auto bg-emerald-700 px-4 py-2.5 rounded-xl hover:bg-emerald-600 transition font-semibold text-sm w-full">
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Orders 📦</h1>
          <p className="text-gray-500 mt-1">Review your past purchases and track order history.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-500">
            No orders found.{" "}
            <button onClick={() => navigate("/products")} className="text-emerald-600 hover:underline">
              Browse products
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {orders.map((order) => {
                const product = products[order.productId];
                const totalAmountNum = Number(order.totalAmount) || 0;
                
                return (
                  <div 
                    key={order.orderId} 
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => navigate(`/my-orders/${order.orderId}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 font-bold text-lg">
                        {product ? product.name.charAt(0) : "P"}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{product ? product.name : `Product ID: ${order.productId}`}</p>
                        <p className="text-xs text-gray-500">Ordered on {format(new Date(order.orderDate), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                        onClick={(e) => handleDeleteOrder(e, order.orderId)}
                        disabled={deletingOrderId === order.orderId}
                      >
                        {deletingOrderId === order.orderId ? "Deleting…" : "Delete"}
                      </button>

                      <div className="text-right">
                      <p className="font-bold text-gray-900">₹{totalAmountNum.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Qty: {order.quantity}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${order.status === "PLACED" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                        {order.status}
                      </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyOrders;
