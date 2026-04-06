import React, { useState } from "react";
import { fetchOpenFDARecommendations } from "../services/recommendationIntegrationService";

const SymptomPage = () => {
  const [symptom, setSymptom] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || "");
      setSymptom(text.trim());
    };

    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!symptom.trim()) {
      setError("Please enter or upload symptom");
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const data = await fetchOpenFDARecommendations(symptom.trim());
      setResult(data);
    } catch (e) {
      console.error(e);
      setError("Error fetching recommendation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Health Recommendation System</h2>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Enter symptom (e.g. fever)"
          value={symptom}
          onChange={(e) => setSymptom(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-md px-3 py-2"
        />

        <input type="file" accept=".txt" onChange={handleFileUpload} />

        <button
          onClick={handleSubmit}
          className="px-4 py-2 rounded-md bg-blue-600 text-white"
          disabled={loading}
        >
          {loading ? "Loading..." : "Get Recommendation"}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {result && (
          <div className="mt-4 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold">Result for: {result.symptom}</h3>
            <p className="text-sm text-gray-700 mt-1">{result.message}</p>

            {Array.isArray(result.suggestions) && (
              <ul className="list-disc pl-6 mt-3 space-y-1">
                {result.suggestions.map((item, index) => (
                  <li key={index} className="text-sm text-gray-800">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SymptomPage;
