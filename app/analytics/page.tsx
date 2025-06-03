'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { AnalyticsDashboard } from '@/components/analytics/Dashboard';

export default function AnalyticsPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/signin');
    }
  }, [router]);

  if (!isAuthenticated()) {
    return null; // Will be redirected by the useEffect
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
      <AnalyticsDashboard />
    </div>
  );
}
