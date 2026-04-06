import React from "react";
import { Link } from "react-router-dom";

const FancyBackground = ({ children }) => {
  return (
    <div className="relative w-full overflow-hidden">

      {/* Background Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900">

        {/* Floating Blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

        {/* SVG Plus Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

const Home = () => {
  return (
    <div className="flex flex-col">

      {/* HERO SECTION */}
      <FancyBackground>
        <section className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-20 text-white">
          <h1 className="text-5xl font-bold mb-6">
            WellnessHub
          </h1>

          <p className="text-lg max-w-2xl mb-8 text-emerald-200">
            A marketplace connecting patients with certified alternative therapy practitioners.
            Book sessions, manage appointments, and experience holistic wellness.
          </p>

          <div className="flex gap-6">
            <Link
              to="/login"
              className="bg-white text-emerald-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="border border-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-emerald-800 transition"
            >
              Get Started
            </Link>
          </div>
        </section>
      </FancyBackground>


      {/* FEATURES SECTION */}
      <section className="bg-white text-gray-800 py-20 px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 text-center">

          <div>
            <h3 className="text-xl font-semibold mb-3">
              🧘 Discover Therapies
            </h3>
            <p className="text-gray-600">
              Explore a range of wellness therapies and supportive care.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">
              👩‍⚕️ Verified Practitioners
            </h3>
            <p className="text-gray-600">
              Connect with certified and verified professionals for safe and trusted care.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">
              📅 Easy Booking
            </h3>
            <p className="text-gray-600">
              Book appointments and manage your sessions seamlessly in one place.
            </p>
          </div>

        </div>
      </section>


      {/* ROLE SECTION (THIS WAS MISSING) */}
      <section className="bg-gray-100 py-20 px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">

          <div className="bg-white p-8 rounded-xl shadow">
            <h3 className="text-2xl font-bold mb-4 text-emerald-700">
              For Patients
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li>✔ Browse therapies</li>
              <li>✔ Book sessions</li>
              <li>✔ Manage appointments</li>
              <li>✔ Track wellness journey</li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-xl shadow">
            <h3 className="text-2xl font-bold mb-4 text-blue-700">
              For Practitioners
            </h3>
            <ul className="space-y-3 text-gray-600">
              <li>✔ Create professional profile</li>
              <li>✔ Manage patient appointments</li>
              <li>✔ View performance insights</li>
              <li>✔ Grow your practice</li>
            </ul>
          </div>

        </div>
      </section>


      {/* FOOTER */}
      <FancyBackground>
        <footer className="text-center text-emerald-200 text-sm py-8">
          © 2026 WellnessHub. All rights reserved.
        </footer>
      </FancyBackground>

    </div>
  );
};

export default Home;
