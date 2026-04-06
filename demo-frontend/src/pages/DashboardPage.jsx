import React from "react";

const DashboardPage = () => {
  // Dummy data (temporary for milestone)
  const analyticsData = [
    { symptom: "fever", message: "Take rest and stay hydrated" },
    { symptom: "headache", message: "Drink water and relax" },
    { symptom: "cold", message: "Consult doctor if needed" },
  ];

  const totalSearches = analyticsData.length;
  const lastSearch = analyticsData[analyticsData.length - 1];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Analytics Dashboard</h2>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <p>
          <span className="font-semibold">Total Searches:</span> {totalSearches}
        </p>
        <p>
          <span className="font-semibold">Last Searched Symptom:</span> {lastSearch.symptom}
        </p>
      </div>

      <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
      <ul className="space-y-2">
        {analyticsData.map((item, index) => (
          <li key={index} className="border border-gray-200 rounded-md p-3">
            <span className="font-semibold">{item.symptom}</span> → {item.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DashboardPage;
