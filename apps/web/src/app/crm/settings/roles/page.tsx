'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CRMRolesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to users page - roles are now a tab there
    router.replace('/crm/settings/users');
  }, [router]);

  return null;
}
