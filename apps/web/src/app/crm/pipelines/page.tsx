'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@/components/ui/loading-state';

export default function PipelinesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/crm/settings/pipelines');
  }, [router]);

  return <LoadingState text="Redirecting to Pipelines..." />;
}
