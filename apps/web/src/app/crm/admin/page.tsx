'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@/components/ui/loading-state';

export default function CRMAdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/crm/settings');
  }, [router]);

  return <LoadingState text="Redirecting to CRM Settings..." />;
}
