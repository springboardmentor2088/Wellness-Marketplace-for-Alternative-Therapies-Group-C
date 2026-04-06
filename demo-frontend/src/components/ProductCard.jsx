import React from "react";
import { Link } from "react-router-dom";
import Button from "./Button";
import { useCart } from "../context/CartContext";
import { getProductImageSrc } from "../services/imageService";
import { useWishlist } from "../context/WishlistContext";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const imageUrl = getProductImageSrc(product);
  const wished = isWishlisted(product?.id);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm relative group hover:shadow-md transition">
      <button 
        type="button"
        onClick={async () => {
          try {
            await toggleWishlist(product.id);
          } catch (e) {
            console.error("Wishlist toggle error", e);
          }
        }}
        className={`absolute top-3 right-3 p-2 rounded-full z-10 border ${wished ? "text-red-600 bg-red-50 border-red-100" : "text-gray-500 bg-white border-gray-200 hover:text-red-500"}`}
        title={wished ? "Remove from Wishlist" : "Add to Wishlist"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={wished ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      <div className="mb-3 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="h-40 w-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="flex h-40 w-full items-center justify-center text-sm text-gray-500">
            No image
          </div>
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>

      <p className="mt-2 text-sm text-gray-600 line-clamp-3">{product.description}</p>

      <div className="mt-3 space-y-1 text-sm text-gray-700">
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

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/products/${product.id}`}>
          <Button variant="secondary" className="w-auto py-2 px-4 rounded-xl">
            View Details
          </Button>
        </Link>
        <Button
          variant="primary"
          className="w-auto py-2 px-4 rounded-xl"
          onClick={() => addToCart(product, 1)}
        >
          Add to Cart
        </Button>
      </div>

    </div>
  );
};

export default ProductCard;
