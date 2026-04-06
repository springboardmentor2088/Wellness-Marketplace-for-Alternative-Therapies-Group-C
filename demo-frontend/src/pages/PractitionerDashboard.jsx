import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import { getSessions } from "../services/sessionService";
import { getMyPractitionerProfile, getPractitionerEarnings } from "../services/practitionerService";
import { getMyProducts, addMyProductWithImage, deleteMyProduct } from "../services/productService";
import CalendarWidget from "../components/CalendarWidget";
import { format, isSameDay } from "date-fns";

const PractitionerDashboard = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [earnings, setEarnings] = useState(null);
  const [profile, setProfile] = useState(null);
  const [myProducts, setMyProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [productNotice, setProductNotice] = useState("");
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
  });
  const name = localStorage.getItem("name") || "Doctor";

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await getSessions();
        setSessions(response.data);

        try {
          const profileRes = await getMyPractitionerProfile();
          setProfile(profileRes.data);
        } catch (e) {
          // Ignore if profile not created yet
          setProfile(null);
        }
      } catch (err) {
        setError("Failed to load dashboard");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === "earnings") {
      const fetchEarnings = async () => {
        try {
          const res = await getPractitionerEarnings();
          setEarnings(res.data);
        } catch (err) {
          console.error("Failed to load earnings", err);
        }
      };
      fetchEarnings();
    }
  }, [activeTab]);

  const fetchMyProducts = async () => {
    setProductsLoading(true);
    setProductsError("");
    try {
      const res = await getMyProducts();
      setMyProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data || "Failed to load your products.";
      setProductsError(typeof message === "string" ? message : "Failed to load your products.");
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "products") {
      fetchMyProducts();
    }
  }, [activeTab]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleProductInputChange = (event) => {
    const { name, value } = event.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = async (event) => {
    event.preventDefault();
    setProductNotice("");
    setProductsError("");

    if (!productForm.name.trim() || !productForm.price.trim()) {
      setProductsError("Product name and price are required.");
      return;
    }

    const payload = {
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      price: Number(productForm.price),
      category: productForm.category.trim(),
      stock: productForm.stock === "" ? 0 : Number(productForm.stock),
    };

    if (Number.isNaN(payload.price) || payload.price <= 0) {
      setProductsError("Price must be greater than 0.");
      return;
    }

    if (Number.isNaN(payload.stock) || payload.stock < 0) {
      setProductsError("Stock cannot be negative.");
      return;
    }

    setIsSubmittingProduct(true);
    try {
      await addMyProductWithImage(payload, selectedImageFile);
      setProductForm({
        name: "",
        description: "",
        price: "",
        category: "",
        stock: "",
      });
      setSelectedImageFile(null);
      setProductNotice("Product added successfully.");
      await fetchMyProducts();
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data || "Failed to add product.";
      setProductsError(typeof message === "string" ? message : "Failed to add product.");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    setProductNotice("");
    setProductsError("");

    try {
      await deleteMyProduct(productId);
      setProductNotice("Product removed successfully.");
      await fetchMyProducts();
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data || "Failed to delete product.";
      setProductsError(typeof message === "string" ? message : "Failed to delete product.");
    }
  };

  // Sessions on the calendar-selected date
  const sessionsOnSelectedDate = sessions.filter(s =>
    isSameDay(new Date(s.date), calendarDate)
  );

  // Upcoming booked sessions (sorted)
  const upcomingSessions = sessions
    .filter(s => s.status === "booked" && new Date(s.date) > new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Stats
  const bookedCount = sessions.filter(s => s.status === "booked").length;
  const completedCount = sessions.filter(s => s.status === "completed").length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white p-6 space-y-4 flex flex-col">
        <h2 className="text-2xl font-bold mb-2">WellnessHub</h2>
        <nav className="space-y-1 text-sm flex-1">
          <p onClick={() => setActiveTab("dashboard")} className={`px-3 py-2 rounded-lg font-semibold cursor-pointer transition ${activeTab === "dashboard" ? "bg-blue-800" : "hover:bg-blue-800"}`}>Dashboard</p>
          <p onClick={() => setActiveTab("earnings")} className={`px-3 py-2 rounded-lg font-semibold cursor-pointer transition ${activeTab === "earnings" ? "bg-blue-800" : "hover:bg-blue-800"}`}>Earnings</p>
          <p onClick={() => setActiveTab("products")} className={`px-3 py-2 rounded-lg font-semibold cursor-pointer transition ${activeTab === "products" ? "bg-blue-800" : "hover:bg-blue-800"}`}>My Products</p>
          <p onClick={() => navigate("/my-sessions")} className="px-3 py-2 hover:bg-blue-800 rounded-lg cursor-pointer transition">Appointments</p>
          <p onClick={() => navigate("/availability")} className="px-3 py-2 hover:bg-blue-800 rounded-lg cursor-pointer transition">Manage Availability</p>
          <p onClick={() => navigate("/community")} className="px-3 py-2 hover:bg-blue-800 rounded-lg cursor-pointer transition">Community Q&A</p>
          <p onClick={() => navigate("/practitioner-profile")} className="px-3 py-2 hover:bg-blue-800 rounded-lg cursor-pointer transition">Profile</p>
        </nav>
        <button onClick={handleLogout} className="mt-auto bg-blue-700 px-4 py-2.5 rounded-xl hover:bg-blue-600 transition w-full font-semibold text-sm">
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === "dashboard" && (
          <>
            {/* Greeting */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Hello, Dr. {name} 👋</h1>
              <p className="text-gray-500 mt-1">Manage your patients and session availability.</p>
              {profile && (
                <p className="text-xs text-gray-500 mt-2">
                  {profile.specialization ? `Specialization: ${profile.specialization}` : ""}
                  {profile.licenseNumber ? ` · License: ${profile.licenseNumber}` : ""}
                  {profile.experienceYears != null ? ` · Experience: ${profile.experienceYears} yrs` : ""}
                </p>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <p className="text-sm text-gray-500 font-medium">Upcoming Sessions</p>
                <p className="text-3xl font-extrabold text-blue-600 mt-2">{bookedCount}</p>
                <p className="text-xs text-gray-400 mt-1">Booked & pending</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <p className="text-sm text-gray-500 font-medium">Completed Sessions</p>
                <p className="text-3xl font-extrabold text-green-600 mt-2">{completedCount}</p>
                <p className="text-xs text-gray-400 mt-1">All time</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <p className="text-sm text-gray-500 font-medium">Total Sessions</p>
                <p className="text-3xl font-extrabold text-gray-700 mt-2">{sessions.length}</p>
                <p className="text-xs text-gray-400 mt-1">All statuses</p>
              </div>
            </div>

            {/* Calendar + Sessions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
              {/* Calendar */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold text-gray-800 mb-1">Session Calendar</h2>
                <p className="text-xs text-gray-500 mb-4">Click a date to view sessions on that day</p>
                <CalendarWidget onDateSelect={setCalendarDate} selectedDate={calendarDate} />
                {sessionsOnSelectedDate.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {format(calendarDate, "MMM d")} — {sessionsOnSelectedDate.length} session{sessionsOnSelectedDate.length !== 1 ? "s" : ""}
                    </p>
                    {sessionsOnSelectedDate.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                        <div>
                          <p className="text-xs font-bold text-blue-900">{s.client?.name}</p>
                          <p className="text-xs text-blue-600">{format(new Date(s.date), "hh:mm a")}</p>
                        </div>
                        <button onClick={() => navigate(`/sessions/${s.id}`)} className="text-blue-600 text-xs font-bold hover:underline">View</button>
                      </div>
                    ))}
                  </div>
                )}
                {sessionsOnSelectedDate.length === 0 && (
                  <p className="mt-4 text-xs text-gray-400 text-center">No sessions on {format(calendarDate, "MMMM d")}</p>
                )}
              </div>

              {/* Upcoming Sessions */}
              <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-800">Upcoming Appointments</h2>
                  <button onClick={() => navigate("/my-sessions")} className="text-xs text-blue-600 font-bold hover:underline">View all</button>
                </div>
                {upcomingSessions.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {upcomingSessions.slice(0, 5).map(session => (
                      <div key={session.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-bold text-sm">
                            {session.client?.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{session.client?.name}</p>
                            <p className="text-xs text-gray-500">{format(new Date(session.date), "MMM d, yyyy · hh:mm a")}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/sessions/${session.id}`)}
                          className="text-blue-600 text-xs font-bold hover:underline"
                        >
                          View Notes
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <p className="text-gray-500 text-sm">No upcoming appointments.</p>
                    <button
                      onClick={() => navigate("/availability")}
                      className="mt-3 text-blue-600 text-sm font-bold hover:underline"
                    >
                      Add availability slots →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold text-gray-800 mb-1">Manage Availability</h2>
                <p className="text-sm text-gray-500 mb-5">Add or remove time slots for patient bookings.</p>
                <button
                  onClick={() => navigate("/availability")}
                  className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
                >
                  Open Availability Manager
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold text-gray-800 mb-1">Session History</h2>
                <p className="text-sm text-gray-500 mb-5">Review all past and upcoming therapy sessions.</p>
                <button
                  onClick={() => navigate("/my-sessions")}
                  className="w-full py-3.5 bg-gray-800 text-white rounded-2xl font-bold hover:bg-gray-700 transition"
                >
                  View All Sessions
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === "earnings" && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Earnings & Payouts 💰</h1>
              <p className="text-gray-500 mt-1">Track your consultation and product sales revenue.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 bg-gradient-to-br from-indigo-50 to-white">
                <p className="text-sm text-gray-500 font-medium">Total Balance</p>
                <p className="text-4xl font-black text-indigo-600 mt-2">₹ {earnings?.balance || "0.00"}</p>
                <p className="text-xs text-green-600 mt-1">↑ Settled & available</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <p className="text-sm text-gray-500 font-medium">Completed Sessions</p>
                <p className="text-3xl font-extrabold text-gray-800 mt-2">{completedCount}</p>
                <p className="text-xs text-gray-400 mt-1">Earned ₹{completedCount * 500}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <p className="text-sm text-gray-500 font-medium">Earnings rate</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">₹500 / Hr</p>
                <p className="text-xs text-gray-400 mt-1">Standard consulting fee</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Payout History</h2>
              <div className="flex items-center justify-center h-48 border border-dashed border-gray-200 rounded-xl">
                <p className="text-sm text-gray-400">No recent payout transactions recorded yet.</p>
              </div>
            </div>
          </>
        )}

        {activeTab === "products" && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800">My Wellness Products</h1>
              <p className="text-gray-500 mt-1">Add products to your catalog and manage your existing inventory.</p>
            </div>

            {productsError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{productsError}</div>
            )}

            {productNotice && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">{productNotice}</div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold text-gray-800 mb-1">Add New Product</h2>
                <p className="text-sm text-gray-500 mb-5">These products will be visible in the patient wellness store.</p>

                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <input
                      type="text"
                      name="name"
                      value={productForm.name}
                      onChange={handleProductInputChange}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="e.g. Herbal Stress Relief Tea"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      value={productForm.description}
                      onChange={handleProductInputChange}
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Short benefits and usage details"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (INR)</label>
                      <input
                        type="number"
                        name="price"
                        min="1"
                        step="0.01"
                        value={productForm.price}
                        onChange={handleProductInputChange}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="499"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                      <input
                        type="number"
                        name="stock"
                        min="0"
                        value={productForm.stock}
                        onChange={handleProductInputChange}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="25"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      name="category"
                      value={productForm.category}
                      onChange={handleProductInputChange}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Supplements, Fitness, Herbal, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        setSelectedImageFile(file);
                      }}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional. Upload a local image file (JPG, PNG, WEBP, etc.).
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingProduct}
                    className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition disabled:opacity-60"
                  >
                    {isSubmittingProduct ? "Adding product..." : "Add Product"}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-800">Your Product Catalog</h2>
                  <button
                    onClick={fetchMyProducts}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Refresh
                  </button>
                </div>

                {productsLoading ? (
                  <div className="py-10 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : myProducts.length === 0 ? (
                  <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center">
                    <p className="text-sm text-gray-500">No products added yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Use the form to add your first product.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                    {myProducts.map((product) => (
                      <div key={product.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{product.category || "Uncategorized"}</p>
                            <p className="text-xs text-gray-500 mt-1">Stock: {product.stock ?? 0}</p>
                          </div>
                          <p className="text-sm font-extrabold text-blue-700">₹{product.price}</p>
                        </div>

                        {product.description && (
                          <p className="text-xs text-gray-600 mt-2">{product.description}</p>
                        )}

                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-xs font-bold text-red-600 hover:underline"
                          >
                            Remove Product
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
};

export default PractitionerDashboard;
