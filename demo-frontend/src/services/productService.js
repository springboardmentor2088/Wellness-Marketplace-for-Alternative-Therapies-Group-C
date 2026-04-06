import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const getAllProducts = async () => {
  return api.get("/products");
};

export const getProductById = async (id) => {
  return api.get(`/products/${id}`);
};

export const getMyProducts = async () => {
  return api.get("/products/my");
};

export const addMyProduct = async (payload) => {
  return api.post("/products/my", payload);
};

export const addMyProductWithImage = async (payload, imageFile) => {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("description", payload.description || "");
  formData.append("price", String(payload.price));
  formData.append("category", payload.category || "");
  formData.append("stock", String(payload.stock ?? 0));
  if (imageFile) {
    formData.append("image", imageFile);
  }

  return api.post("/products/my/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deleteMyProduct = async (productId) => {
  return api.delete(`/products/my/${productId}`);
};
