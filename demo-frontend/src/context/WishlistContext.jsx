import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { addToWishlist, getWishlistIds, removeFromWishlist } from "../services/wishlistService";

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const hasToken = useMemo(() => Boolean(localStorage.getItem("accessToken")), []);

  const refreshWishlist = async () => {
    if (!localStorage.getItem("accessToken")) {
      setWishlistIds([]);
      setLoadedOnce(true);
      return;
    }

    try {
      const ids = await getWishlistIds();
      setWishlistIds(Array.isArray(ids) ? ids : []);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setWishlistIds([]);
      } else {
        console.error("Failed to load wishlist ids", err);
      }
    } finally {
      setLoadedOnce(true);
    }
  };

  useEffect(() => {
    if (hasToken) {
      refreshWishlist();
    } else {
      setLoadedOnce(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isWishlisted = (productId) => {
    const pid = Number(productId);
    if (!Number.isFinite(pid)) return false;
    return wishlistIds.includes(pid);
  };

  const toggleWishlist = async (productId) => {
    const pid = Number(productId);
    if (!Number.isFinite(pid) || pid <= 0) return;

    if (!localStorage.getItem("accessToken")) {
      throw new Error("Not authenticated");
    }

    if (wishlistIds.includes(pid)) {
      await removeFromWishlist(pid);
      setWishlistIds((prev) => prev.filter((id) => id !== pid));
      return false;
    }

    await addToWishlist(pid);
    setWishlistIds((prev) => [...prev, pid]);
    return true;
  };

  const value = {
    wishlistIds,
    loadedOnce,
    refreshWishlist,
    isWishlisted,
    toggleWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return ctx;
};
