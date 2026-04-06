import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../components/Button";
import ReviewForm from "../components/ReviewForm";
import ReviewList from "../components/ReviewList";
import { getProductById } from "../services/productService";
import { useCart } from "../context/CartContext";
import { deleteProductReview, getProductReviews } from "../services/productReviewService";
import { getProductImageSrc } from "../services/imageService";
import { useWishlist } from "../context/WishlistContext";
import { getCurrentUserId } from "../services/userService";


const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

  const isLoggedIn = useMemo(() => Boolean(localStorage.getItem("accessToken")), []);
  const role = useMemo(() => localStorage.getItem("role"), []);
  const parsedProductId = useMemo(() => Number(id), [id]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const response = await getProductById(id);
        if (isMounted) setProduct(response.data);
      } catch (err) {
        console.error("Error fetching product:", err);
        if (isMounted) setError("Failed to load product details.");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (isLoggedIn) {
      (async () => {
        try {
          const uid = await getCurrentUserId();
          setCurrentUserId(uid);
        } catch (e) {
          console.error("Error fetching user id:", e);
        }
      })();
    }
  }, [isLoggedIn]);

  const formatDate = (isoOrNull) => {
    if (!isoOrNull) return null;
    const d = new Date(isoOrNull);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString();
  };

  const loadReviews = async () => {
    setReviewError("");
    if (!Number.isFinite(parsedProductId) || parsedProductId <= 0) return;

    setLoadingReviews(true);
    try {
      const data = await getProductReviews(parsedProductId);
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching product reviews:", err);
      const msg = err?.response?.data?.message || err?.response?.data || err?.message;
      setReviewError(msg || "Failed to load reviews.");
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!currentUserId) return;
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await deleteProductReview(reviewId, currentUserId);
      loadReviews();
    } catch (err) {
      console.error("Error deleting review:", err);
    }
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedProductId]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return null;
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6">
          <Link to="/products" className="text-sm text-emerald-700 hover:underline">
            ← Back to products
          </Link>
        </div>

        {loading && <p className="text-gray-600">Loading product…</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && product && (
          <div className="space-y-5">
            <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>

              <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                {getProductImageSrc(product) ? (
                  <img
                    src={getProductImageSrc(product)}
                    alt={product.name}
                    className="h-72 w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-72 w-full items-center justify-center text-sm text-gray-500">
                    No image
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-700">
                <p>
                  <b>Description:</b> {product.description}
                </p>
                <p>
                  <b>Category:</b> {product.category}
                </p>
                <p>
                  <b>Price:</b> ₹{product.price}
                </p>
                <p>
                  <b>Stock:</b> {product.stock}
                </p>
              </div>

              <div className="mt-6">
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="w-auto py-2 px-4 rounded-xl"
                    onClick={() => {
                      addToCart(product, 1);
                      navigate("/cart");
                    }}
                  >
                    Add to Cart
                  </Button>

                  <Button
                    variant="secondary"
                    className="w-auto py-2 px-4 rounded-xl"
                    onClick={async () => {
                      try {
                        const added = await toggleWishlist(product.id);
                        if (added) {
                          navigate("/wishlist");
                        }
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                  >
                    {isWishlisted(product.id) ? "Wishlisted" : "Add to Wishlist"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Product reviews</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                    {averageRating ? ` · Avg ${averageRating}/5` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadReviews}
                  disabled={loadingReviews}
                  className="text-sm font-semibold text-emerald-700 hover:underline disabled:opacity-60"
                >
                  {loadingReviews ? "Loading…" : "Refresh"}
                </button>
              </div>

              {reviewError && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-700">{reviewError}</p>
                </div>
              )}

              <div className="mt-5">
                <h4 className="text-sm font-bold text-gray-900">Leave a product review</h4>
                <ReviewForm
                  productId={parsedProductId}
                  canSubmit={isLoggedIn && (!role || role === "PATIENT")}
                  disabledReason={
                    !isLoggedIn
                      ? "Login to submit a product review."
                      : role && role !== "PATIENT"
                      ? "Only patients can submit product reviews."
                      : ""
                  }
                  onSubmitted={loadReviews}
                />
              </div>

              <div className="mt-6">
                <ReviewList 
                  reviews={reviews} 
                  loading={loadingReviews} 
                  formatDate={formatDate} 
                  currentUserId={currentUserId}
                  onDeleteReview={handleDeleteReview}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
