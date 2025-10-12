// src/app/dashboard/messages/page.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';

export default function MessagesPage() {
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchThreads = async () => {
            try {
                const response = await api.get('/chats');
                setThreads(response.data);
            } catch (error) {
                console.error("Failed to fetch message threads", error);
            } finally {
                setLoading(false);
            }
        };
        fetchThreads();
    }, []);

    if (loading) return <div className="text-center mt-10">Loading messages...</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Your Conversations</h1>
                <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
                    {threads.length > 0 ? (
                        threads.map(thread => (
                            <Link key={thread.thread_id} href={`/chat/${thread.thread_id}`}>
                                <div className="border p-4 rounded-md hover:bg-gray-50 cursor-pointer">
                                    <p className="font-semibold text-indigo-600">
                                        Chat with {thread.other_user_name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Regarding job: {thread.job_title}
                                    </p>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <p>You have no active conversations.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
