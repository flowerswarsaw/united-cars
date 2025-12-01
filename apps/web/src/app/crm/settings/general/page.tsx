'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { useAuth } from '@/contexts/auth-context';
import { UserProfile, CompanySettings, UserPreferences } from '@united-cars/mock-data/types';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PersonalInfoForm } from '@/components/settings/personal-info-form';
import { CompanyInfoForm } from '@/components/settings/company-info-form';
import { PreferencesForm } from '@/components/settings/preferences-form';
import { SecuritySection } from '@/components/settings/security-section';
import { useToast } from '@/components/ui/use-toast';
import { User, Building2, Settings as SettingsIcon, Shield } from 'lucide-react';

interface SettingsData {
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  companySettings: CompanySettings | null;
}

export default function GeneralSettingsPage() {
  const { user } = useSession();
  const { updateUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [settingsData, setSettingsData] = useState<SettingsData>({
    profile: null,
    preferences: null,
    companySettings: null
  });
  const [activeTab, setActiveTab] = useState('personal');

  const isAdmin = user?.roles?.includes('ADMIN');

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Fetch user profile and preferences
      const profileResponse = await fetch('/api/user/profile');
      if (!profileResponse.ok) {
        throw new Error('Failed to load profile');
      }
      const profileData = await profileResponse.json();

      let companyData = null;
      if (isAdmin) {
        // Fetch company settings (admin only)
        const companyResponse = await fetch('/api/org/settings');
        if (companyResponse.ok) {
          companyData = await companyResponse.json();
        }
      }

      setSettingsData({
        profile: profileData.profile,
        preferences: profileData.preferences,
        companySettings: companyData
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (updates: Partial<UserProfile>) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: updates })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      setSettingsData(prev => ({
        ...prev,
        profile: data.profile
      }));

      // Update the auth context with the new name
      if (data.profile?.firstName || data.profile?.lastName) {
        const fullName = `${data.profile.firstName || ''} ${data.profile.lastName || ''}`.trim();
        updateUser({ name: fullName });
      }

      toast({
        title: 'Success',
        description: 'Personal information updated successfully'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update personal information',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleCompanyUpdate = async (updates: Partial<CompanySettings>) => {
    try {
      const response = await fetch('/api/org/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update company settings');
      }

      const data = await response.json();
      setSettingsData(prev => ({
        ...prev,
        companySettings: data.settings
      }));

      toast({
        title: 'Success',
        description: 'Company information updated successfully'
      });
    } catch (error) {
      console.error('Error updating company settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update company information',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handlePreferencesUpdate = async (updates: Partial<UserPreferences>) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: updates })
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      const data = await response.json();
      setSettingsData(prev => ({
        ...prev,
        preferences: data.preferences
      }));

      toast({
        title: 'Success',
        description: 'Preferences updated successfully'
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update preferences',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    try {
      // TODO: Implement password change API endpoint
      // For now, simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Success',
        description: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Error',
        description: 'Failed to change password',
        variant: 'destructive'
      });
      throw error;
    }
  };

  if (isLoading) {
    return (
      <AppLayout user={user}>
        <LoadingState text="Loading settings..." />
      </AppLayout>
    );
  }

  if (!settingsData.profile) {
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Profile not found</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={user}>
      <PageHeader
        title="General Settings"
        description="Manage your personal information, company details, and preferences"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Settings', href: '/crm/settings/users' },
          { label: 'General' }
        ]}
      />

      <div className="container mx-auto py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Personal</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="company" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Company</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="personal" className="space-y-4">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <h2 className="text-2xl font-semibold mb-6">Personal Information</h2>
                <PersonalInfoForm
                  profile={settingsData.profile}
                  onUpdate={handleProfileUpdate}
                />
              </div>
            </TabsContent>

            {isAdmin && settingsData.companySettings && (
              <TabsContent value="company" className="space-y-4">
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                  <h2 className="text-2xl font-semibold mb-6">Company Information</h2>
                  <CompanyInfoForm
                    settings={settingsData.companySettings}
                    onUpdate={handleCompanyUpdate}
                  />
                </div>
              </TabsContent>
            )}

            <TabsContent value="preferences" className="space-y-4">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                <h2 className="text-2xl font-semibold mb-6">User Preferences</h2>
                <PreferencesForm
                  preferences={settingsData.preferences}
                  onUpdate={handlePreferencesUpdate}
                />
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <h2 className="text-2xl font-semibold mb-6">Security Settings</h2>
              <SecuritySection onPasswordChange={handlePasswordChange} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
}
