// src/app/dashboard/my-jobs/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';

export default function MyJobsPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyJobs = async () => {
            try {
                const response = await api.get('/jobs/my-jobs');
                setJobs(response.data);
            } catch (error) {
                console.error("Failed to fetch jobs", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMyJobs();
    }, []);

    if (loading) return <div className="text-center mt-10">Loading your jobs...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">My Posted Jobs</h1>
                <div className="space-y-4">
                    {jobs.length > 0 ? (
                        jobs.map((job) => (
                            <Link key={job.id} href={`/jobs/${job.id}`}>
                                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 cursor-pointer hover:shadow-lg">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-semibold text-indigo-600">{job.title}</h2>
                                        <span className="text-sm font-medium capitalize px-3 py-1 rounded-full"
                                            style={{
                                                backgroundColor: job.status === 'open' ? '#e0f2fe' : '#dcfce7',
                                                color: job.status === 'open' ? '#0284c7' : '#16a34a'
                                            }}>
                                            {job.status}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-sm mt-2">
                                        Posted on {new Date(job.posted_at).toLocaleDateString()}
                                    </p>
                                    <div className="mt-4 font-bold text-lg text-gray-800">
                                        Bids Received: {job.bid_count}
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="text-center py-10 bg-white rounded-lg shadow-md">
                            <p className="text-gray-600">You haven't posted any jobs yet.</p>
                            <Link href="/jobs/new">
                                <button className="mt-4 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700">
                                    Post Your First Job
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
