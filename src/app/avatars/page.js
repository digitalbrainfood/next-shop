"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function AvatarsRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/'); }, [router]);
    return <div className="min-h-screen flex items-center justify-center text-lg text-gray-500">Redirecting...</div>;
}