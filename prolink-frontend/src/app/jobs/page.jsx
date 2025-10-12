// src/app/jobs/page.jsx
"use client";

import { useState, useEffect } from "react";
import api from "../../lib/api"; // Our smart API client
import Link from "next/link";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        // Fetch jobs from the new public endpoint
        const response = await api.get("/jobs");
        setJobs(response.data);
      } catch (error) {
        console.error("Failed to fetch jobs", error);
        alert("Could not load jobs.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) {
    return <div className="text-center mt-10">Loading jobs...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Find Digital Work
        </h1>

        <div className="space-y-4">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              // The <Link> component is now the parent wrapper for each job
              <Link key={job.id} href={`/jobs/${job.id}`} passHref>
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-indigo-300">
                  {/* The h2 no longer needs its own Link or hover effect */}
                  <h2 className="text-xl font-semibold text-indigo-600">
                    {job.title}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Posted by {job.client_name || "A Client"}
                  </p>
                  {/* We can truncate the description to keep the cards neat */}
                  <p className="text-gray-700 mt-3 line-clamp-2">
                    {job.description}
                  </p>
                  <div className="mt-4 font-bold text-lg text-gray-800">
                    Budget: ₦{Number(job.budget).toLocaleString()}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p>No jobs posted yet. Be the first!</p>
          )}
        </div>
      </div>
    </div>
  );
}
