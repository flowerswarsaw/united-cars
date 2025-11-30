'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@/components/ui/loading-state';

export default function CRMSettingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/crm/settings/users');
  }, [router]);

  return <LoadingState text="Redirecting to User Settings..." />;
}
