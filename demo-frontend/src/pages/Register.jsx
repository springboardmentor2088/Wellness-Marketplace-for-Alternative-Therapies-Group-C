import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import InputField from "../components/InputField";
import Button from "../components/Button";
import {
  registerUser,
  registerPractitioner,
  fetchPractitionerByLicense,
} from "../services/authService";

const Register = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState("PATIENT");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    licenseNumber: "",
    specialization: "",
    issuingAuthority: "",
    verificationStatus: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [isLicenseLoading, setIsLicenseLoading] = useState(false);
  const [licenseLookupMessage, setLicenseLookupMessage] = useState("");
  const [licenseLookupError, setLicenseLookupError] = useState("");
  const [isLicenseResolved, setIsLicenseResolved] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "licenseNumber") {
      setLicenseLookupMessage("");
      setLicenseLookupError("");
      setIsLicenseResolved(false);
      setFormData((prev) => ({
        ...prev,
        name: "",
        email: "",
        specialization: "",
        issuingAuthority: "",
        verificationStatus: "",
      }));
    }
  };

  const handleLicenseBlur = async () => {
    if (role !== "PRACTITIONER") return;

    const licenseNumber = formData.licenseNumber?.trim();
    if (!licenseNumber) return;

    setIsLicenseLoading(true);
    setLicenseLookupMessage("");
    setLicenseLookupError("");

    try {
      const details = await fetchPractitionerByLicense(licenseNumber);
      setFormData((prev) => ({
        ...prev,
        name: details.practitionerName || prev.name,
        email: details.email || prev.email,
        specialization: details.specialization || prev.specialization,
        issuingAuthority: details.issuingAuthority || "NPI Registry",
        verificationStatus: details.verificationStatus || "VERIFIED",
      }));
      setIsLicenseResolved(true);
      setLicenseLookupMessage("License verified. Practitioner details auto-filled.");
    } catch (error) {
      setIsLicenseResolved(false);
      setLicenseLookupError(
        error?.response?.data?.message ||
        "Could not verify license number. Please check and try again."
      );
    } finally {
      setIsLicenseLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setIsLoading(true);

    try {
      let response;

      if (role === "PRACTITIONER" && !isLicenseResolved) {
        throw new Error("Please verify license number first");
      }

      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      };

      if (role === "PATIENT") {
        await registerUser(userData);
      } else {
        // For practitioner, add verification data based on chosen method
        const practitionerData = {
          ...userData,
          specialization: formData.specialization,
          licenseNumber: formData.licenseNumber,
        };

        await registerPractitioner(practitionerData);
      }

      // Don't auto-login after registration
      // Redirect to login page instead
      navigate('/login');
    } catch (error) {
      setApiError(error?.response?.data?.message || error?.message || "Registration failed. Check your details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create Account"
      subtitle="Join the WellnessHub platform"
    >
      <form onSubmit={handleSubmit}>
        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{apiError}</p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Register As
          </label>
          <div className="flex gap-6">
            <label>
              <input
                type="radio"
                value="PATIENT"
                checked={role === "PATIENT"}
                onChange={() => setRole("PATIENT")}
              />{" "}
              Patient
            </label>
            <label>
              <input
                type="radio"
                value="PRACTITIONER"
                checked={role === "PRACTITIONER"}
                onChange={() => setRole("PRACTITIONER")}
              />{" "}
              Practitioner
            </label>
          </div>
        </div>

        <InputField
          label={role === "PRACTITIONER" ? "NPI Number (First Step)" : "Name"}
          type="text"
          name={role === "PRACTITIONER" ? "licenseNumber" : "name"}
          value={role === "PRACTITIONER" ? formData.licenseNumber : formData.name}
          onChange={handleChange}
          onBlur={role === "PRACTITIONER" ? handleLicenseBlur : undefined}
          placeholder={role === "PRACTITIONER" ? "e.g. 1134116056" : undefined}
          required
        />

        {role === "PRACTITIONER" ? (
          <>
            <p className="text-xs text-gray-500 -mt-2 mb-3">
              Enter NPI number first. Other practitioner details are auto-filled.
            </p>

            {isLicenseLoading && (
              <p className="text-xs text-gray-500 -mt-2 mb-3">Checking license details...</p>
            )}
            {licenseLookupMessage && (
              <p className="text-xs text-emerald-600 -mt-2 mb-3">{licenseLookupMessage}</p>
            )}
            {licenseLookupError && (
              <p className="text-xs text-red-600 -mt-2 mb-3">{licenseLookupError}</p>
            )}

            <InputField
              label="Name (from license)"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              readOnly
              required
            />

            <InputField
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <InputField
              label="Specialization (from NPI taxonomy)"
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              readOnly
            />

            <InputField
              label="Source"
              type="text"
              name="issuingAuthority"
              value={formData.issuingAuthority}
              onChange={handleChange}
              readOnly
            />

            <InputField
              label="Verification Status"
              type="text"
              name="verificationStatus"
              value={formData.verificationStatus}
              onChange={handleChange}
              readOnly
            />

            <InputField
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </>
        ) : (
          <>
            <InputField
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <InputField
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </>
        )}

        <div className="mt-6">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            loading={isLoading}
          >
            {isLoading ? "Creating..." : "Sign Up"}
          </Button>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-emerald-600">
            Already have an account? Sign In
          </Link>
        </div>
      </form>
    </AuthCard>
  );
};

export default Register;
