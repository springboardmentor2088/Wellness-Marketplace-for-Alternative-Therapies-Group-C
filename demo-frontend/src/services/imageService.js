import acupressureMat from "../assets/images/acupressure_mat.jpg";
import acupunctureNeedles from "../assets/images/acupuncture_needles.jpg";
import exerciseBall from "../assets/images/exercise_ball.jpg";
import herbalTea from "../assets/images/herbal_tea.jpg";
import lavenderOil from "../assets/images/lavender_oil.jpg";
import lumbarCushion from "../assets/images/lumbar_cushion.jpg";
import neckPillow from "../assets/images/neck_support_pillow.jpg";
import shoulderPulley from "../assets/images/shoulder_pulley.jpg";

const productImages = {
  // Acupressure / Acupuncture
  "Acupressure Mat Set": acupressureMat,
  "Acupuncture Needle Therapy Kit": acupunctureNeedles,

  // Physiotherapy
  "Therapy Exercise Ball": exerciseBall,
  "Shoulder Pulley Physiotherapy Kit": shoulderPulley,

  // Chiropractic
  "Orthopedic Neck Support Pillow": neckPillow,
  "Lumbar Support Cushion": lumbarCushion,

  // Relaxation
  "Aromatherapy Lavender Essential Oil": lavenderOil,
  "Herbal Stress Relief Tea": herbalTea,
};

const FALLBACK_IMAGE = "/product-images/general.svg";
const BACKEND_BASE_URL = "http://localhost:8080";

// Product-specific images provided under /public/product-images/wellness
// Keys are the exact product names (without trailing '*') and include the "(Seller N)" suffix.
const WELLNESS_IMAGE_NAMES = new Set([
  "Ankle Support Brace (Seller 20)",
  "Ankle Support Brace (Seller 23)",
  "Breathing & Grounding Cards (Seller 22)",
  "Cold Therapy Gel Pack (Seller 20)",
  "Cold Therapy Gel Pack (Seller 23)",
  "Daily Wellness Multivitamin (Seller 21)",
  "Digital Blood Pressure Monitor (Seller 21)",
  "Family First Aid Kit (Seller 19)",
  "Glucometer Starter Kit (Seller 21)",
  "Guided Mindfulness Journal (Seller 22)",
  "Hand Hygiene Essentials Kit (Seller 2)",
  "Heart Health Omega-3 (Seller 21)",
  "Home Wellness Starter Pack (Seller 19)",
  "Immune Support Vitamin C + Zinc (Seller 2)",
  "Kids Multivitamin Gummies (Seller 19)",
  "Knee Compression Sleeve (Seller 20)",
  "Knee Compression Sleeve (Seller 23)",
  "Non-Contact Thermometer (Seller 19)",
  "Oral Rehydration Salts (ORS) (Seller 2)",
  "Posture Support Belt (Seller 20)",
  "Posture Support Belt (Seller 23)",
  "Sleep Hygiene Toolkit (Seller 22)",
  "Stress Management Workbook (Seller 22)",
  "Travel Health Kit (Seller 2)",
]);

const normalizeCatalogName = (name) => {
  if (!name) return "";
  return String(name)
    .replace(/\*+\s*$/, "")
    .trim();
};

const normalizeName = (name) => {
  if (!name) return "";
  return String(name)
    .replace(/\s*\(Seller\s*\d+\)\s*$/i, "")
    .replace(/\*+\s*$/, "")
    .trim();
};

export const getImageByName = (name) => {
  const normalized = normalizeName(name);
  return productImages[normalized] || null;
};

export const getProductImageSrc = (productLike) => {
  // Prefer exact product-name based images when available.
  const rawName = normalizeCatalogName(productLike?.name);
  if (WELLNESS_IMAGE_NAMES.has(rawName)) {
    return encodeURI(`/product-images/wellness/${rawName}.jpg`);
  }

  // Otherwise, prefer backend-provided imageUrl (encode to handle spaces/parentheses if any).
  const explicit = productLike?.imageUrl;
  if (typeof explicit === "string" && explicit.trim()) {
    const trimmed = explicit.trim();
    if (trimmed.startsWith("/")) {
      return encodeURI(`${BACKEND_BASE_URL}${trimmed}`);
    }
    return encodeURI(trimmed);
  }

  return getImageByName(productLike?.name) || FALLBACK_IMAGE;
};
