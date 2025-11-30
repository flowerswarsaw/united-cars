'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingState } from '@/components/ui/loading-state';

export default function DealsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/crm/deals/kanban');
  }, [router]);

  return <LoadingState text="Redirecting to Kanban..." />;
}
