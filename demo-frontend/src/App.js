import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from "./pages/Home";
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PractitionerProfile from "./pages/PractitionerProfile";
import PatientDashboard from "./pages/PatientDashboard";
import PractitionerDashboard from "./pages/PractitionerDashboard";
import PractitionerListing from './pages/PractitionerListing';
import BookingPage from './pages/BookingPage';
import AvailabilityPage from './pages/AvailabilityPage';
import MySessions from './pages/MySessions';
import SessionDetail from './pages/SessionDetail';
import OAuth2CallbackPage from './pages/OAuth2CallbackPage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import MyOrders from './pages/MyOrders';
import OrderDetails from './pages/OrderDetails';
import WishlistPage from './pages/WishlistPage';
import CommunityQAPage from './pages/CommunityQAPage';
import ReviewFormPage from './pages/ReviewFormPage';
import SymptomPage from './pages/SymptomPage';
import DashboardPage from './pages/DashboardPage';
import ChatbotPage from './pages/ChatbotPage';
import NotificationsPage from './pages/NotificationsPage';
import ChatbotLauncher from './components/ChatbotLauncher';
import ProtectedRoute from './components/ProtectedRoute';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import './App.css';

function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <Router>
          <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route
            path="/patient-dashboard"
            element={
              <ProtectedRoute requiredRole="PATIENT">
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practitioner-dashboard"
            element={
              <ProtectedRoute requiredRole="PRACTITIONER">
                <PractitionerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practitioner-profile"
            element={
              <ProtectedRoute requiredRole="PRACTITIONER">
                <PractitionerProfile />
              </ProtectedRoute>
            }
          />

          <Route path="/practitioners" element={<PractitionerListing />} />
          <Route
            path="/book/:id"
            element={
              <ProtectedRoute requiredRole="PATIENT">
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route path="/my-sessions" element={<MySessions />} />
          <Route
            path="/availability"
            element={
              <ProtectedRoute requiredRole="PRACTITIONER">
                <AvailabilityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions/:id"
            element={
              <ProtectedRoute>
                <SessionDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/oauth2callback" element={<OAuth2CallbackPage />} />

          {/* Product Store */}
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route
            path="/cart"
            element={
              <ProtectedRoute requiredRole="PATIENT">
                <CartPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute requiredRole="PATIENT">
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute requiredRole="PATIENT">
                <MyOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders/:id"
            element={
              <ProtectedRoute requiredRole="PATIENT">
                <OrderDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute requiredRole="PATIENT">
                <WishlistPage />
              </ProtectedRoute>
            }
          />

          {/* Community Q&A */}
          <Route path="/community" element={<CommunityQAPage />} />

          {/* Reviews */}
          <Route
            path="/reviews/practitioner/:practitionerId/new"
            element={
              <ProtectedRoute requiredRole="PATIENT">
                <ReviewFormPage />
              </ProtectedRoute>
            }
          />

          {/* Milestone 4 */}
          <Route
            path="/symptom"
            element={
              <ProtectedRoute requiredRole="PATIENT">
                <SymptomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="PATIENT">
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chatbot"
            element={
              <ProtectedRoute requiredRole="PATIENT">
                <ChatbotPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute requiredRole="PATIENT">
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Default Routes */}
          <Route path="/" element={<Home />} />

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <ChatbotLauncher />
        </Router>
      </WishlistProvider>
    </CartProvider>
  );
}

export default App;
