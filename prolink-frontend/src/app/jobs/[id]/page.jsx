// src/app/jobs/[id]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidForm, setBidForm] = useState({ amount: '', proposal: '' });
  const [isOwner, setIsOwner] = useState(false);

  const fetchData = async () => {
    try {
      const response = await api.get(`/jobs/${id}`);
      setJobData(response.data);
      setIsOwner(response.data.bids !== null);
    } catch (error) {
      console.error("Failed to fetch job data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleBidChange = (e) => {
    setBidForm({ ...bidForm, [e.target.name]: e.target.value });
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/jobs/${id}/bids`, bidForm);
      alert('Bid submitted successfully!');
      setBidForm({ amount: '', proposal: '' });
    } catch (error) {
      console.error("Failed to submit bid", error);
      alert('Bid failed: ' + (error.response?.data?.msg || 'Please try again.'));
    }
  };

  const handleContact = async (bid) => {
    try {
      const response = await api.post('/chats/initiate', {
        jobId: jobData.id,
        providerId: bid.provider_id
      });
      const { threadId } = response.data;
      router.push(`/chat/${threadId}`);
    } catch (error) {
      console.error("Failed to initiate chat", error);
      alert("Could not start a conversation.");
    }
  };

  const handleHire = async (bid) => {
    if (window.confirm(`Are you sure you want to hire ${bid.full_name} for ₦${Number(bid.amount).toLocaleString()}?`)) {
      try {
        const hireData = {
          providerId: bid.provider_id,
          agreedAmount: bid.amount
        };
        await api.post(`/jobs/${id}/hire`, hireData);
        alert('Freelancer hired successfully!');
        fetchData(); // Re-fetch data to update job status
      } catch (error) {
        console.error("Failed to hire freelancer", error);
        alert('Failed to hire: ' + (error.response?.data?.msg || 'Please try again.'));
      }
    }
  };

  if (loading) return <div className="text-center mt-20">Loading...</div>;
  if (!jobData) return <div className="text-center mt-20">Job not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Job Details Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border mb-8">
          <h1 className="text-3xl font-bold">{jobData.title}</h1>
          <p className="mt-2">Status: <span className="font-semibold capitalize text-indigo-600">{jobData.status}</span></p>
          <p className="text-gray-500 mt-1">Posted by {jobData.client_name || 'A Client'}</p>
          <div className="mt-4 font-bold text-xl">Budget: ₦{Number(jobData.budget).toLocaleString()}</div>
          <p className="mt-4 whitespace-pre-wrap">{jobData.description}</p>
        </div>

        {isOwner ? (
          // Bids List View (For Client)
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Bids Received ({jobData.bids?.length || 0})</h2>
            {jobData.bids && jobData.bids.length > 0 ? (
              jobData.bids.map(bid => (
                <div key={bid.id} className="bg-white p-4 rounded-lg shadow-md border mb-4">
                  <div className="flex justify-between items-center">
                    <Link href={`/profiles/${bid.provider_id}`}>
                      <span className="font-semibold text-indigo-600 hover:underline cursor-pointer">{bid.full_name || 'A Freelancer'}</span>
                    </Link>
                    <span className="font-bold text-lg text-green-600">₦{Number(bid.amount).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-600 mt-2">{bid.proposal}</p>
                  <div className="mt-4">
                    <button onClick={() => handleContact(bid)} className="mr-2 px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:bg-gray-400">
                      Message
                    </button>
                    <button 
                      onClick={() => handleHire(bid)} 
                      disabled={jobData.status !== 'open'}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {jobData.status === 'open' ? 'Hire Freelancer' : 'Hired'}
                    </button>
                  </div>
                </div>
              ))
            ) : <p>No bids have been placed on this job yet.</p>}
          </div>
        ) : (
          // Bidding Form (For Freelancers)
          <div className="mt-8 bg-white p-6 rounded-lg shadow-md border h-fit">
            <h2 className="text-xl font-semibold text-center">Place Your Bid</h2>
            <form onSubmit={handleBidSubmit} className="space-y-4 mt-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium">Your Bid Amount (₦)</label>
                <input id="amount" name="amount" type="number" required value={bidForm.amount} onChange={handleBidChange} className="w-full px-3 py-2 mt-1 border rounded-md" />
              </div>
              <div>
                <label htmlFor="proposal" className="block text-sm font-medium">Your Proposal</label>
                <textarea id="proposal" name="proposal" rows="5" required value={bidForm.proposal} onChange={handleBidChange} className="w-full px-3 py-2 mt-1 border rounded-md" />
              </div>
              <button type="submit" className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md">Submit Bid</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

