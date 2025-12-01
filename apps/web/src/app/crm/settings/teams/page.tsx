'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CRMTeamsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to users page - teams are now a tab there
    router.replace('/crm/settings/users');
  }, [router]);

  return null;
}
