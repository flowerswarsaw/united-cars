'use client';

import { useState } from 'react';
import { UserPreferences } from '@united-cars/mock-data/types';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface PreferencesFormProps {
  preferences: UserPreferences | null;
  onUpdate: (updates: Partial<UserPreferences>) => Promise<void>;
}

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' }
];

const TIME_FORMATS = [
  { value: '12h', label: '12-hour (1:00 PM)' },
  { value: '24h', label: '24-hour (13:00)' }
];

const NUMBER_FORMATS = [
  { value: '1,234.56', label: '1,234.56 (US/UK)' },
  { value: '1.234,56', label: '1.234,56 (Europe)' }
];

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'CNY', label: 'CNY (¥)' }
];

export function PreferencesForm({ preferences, onUpdate }: PreferencesFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    dateFormat: preferences?.dateFormat || 'MM/DD/YYYY',
    timeFormat: preferences?.timeFormat || '12h',
    numberFormat: preferences?.numberFormat || '1,234.56',
    currency: preferences?.currency || 'USD',
    emailNotifications: preferences?.emailNotifications ?? true,
    smsNotifications: preferences?.smsNotifications ?? false,
    desktopNotifications: preferences?.desktopNotifications ?? true,
    notifyOnDealUpdate: preferences?.notifyOnDealUpdate ?? true,
    notifyOnPayment: preferences?.notifyOnPayment ?? true,
    notifyOnInvoice: preferences?.notifyOnInvoice ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onUpdate(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        {/* Display Preferences */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Display Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format *</Label>
              <Select
                value={formData.dateFormat}
                onValueChange={(value) => handleSelectChange('dateFormat', value)}
              >
                <SelectTrigger id="dateFormat">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeFormat">Time Format *</Label>
              <Select
                value={formData.timeFormat}
                onValueChange={(value) => handleSelectChange('timeFormat', value)}
              >
                <SelectTrigger id="timeFormat">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberFormat">Number Format *</Label>
              <Select
                value={formData.numberFormat}
                onValueChange={(value) => handleSelectChange('numberFormat', value)}
              >
                <SelectTrigger id="numberFormat">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {NUMBER_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleSelectChange('currency', value)}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value}>
                      {curr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose how you want to receive notifications
              </p>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <Label htmlFor="emailNotifications" className="text-base">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive notifications via email
                  </p>
                </div>
                <input
                  id="emailNotifications"
                  type="checkbox"
                  checked={formData.emailNotifications}
                  onChange={(e) => handleCheckboxChange('emailNotifications', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <Label htmlFor="smsNotifications" className="text-base">
                    SMS Notifications
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive notifications via SMS
                  </p>
                </div>
                <input
                  id="smsNotifications"
                  type="checkbox"
                  checked={formData.smsNotifications}
                  onChange={(e) => handleCheckboxChange('smsNotifications', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <Label htmlFor="desktopNotifications" className="text-base">
                    Desktop Notifications
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive browser notifications
                  </p>
                </div>
                <input
                  id="desktopNotifications"
                  type="checkbox"
                  checked={formData.desktopNotifications}
                  onChange={(e) => handleCheckboxChange('desktopNotifications', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="pt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Notify me when
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <Label htmlFor="notifyOnDealUpdate" className="text-base">
                      Deal Updates
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      When a deal is updated or changes status
                    </p>
                  </div>
                  <input
                    id="notifyOnDealUpdate"
                    type="checkbox"
                    checked={formData.notifyOnDealUpdate}
                    onChange={(e) => handleCheckboxChange('notifyOnDealUpdate', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <Label htmlFor="notifyOnPayment" className="text-base">
                      Payment Received
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      When a payment is received or processed
                    </p>
                  </div>
                  <input
                    id="notifyOnPayment"
                    type="checkbox"
                    checked={formData.notifyOnPayment}
                    onChange={(e) => handleCheckboxChange('notifyOnPayment', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <Label htmlFor="notifyOnInvoice" className="text-base">
                      Invoice Created
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      When a new invoice is created
                    </p>
                  </div>
                  <input
                    id="notifyOnInvoice"
                    type="checkbox"
                    checked={formData.notifyOnInvoice}
                    onChange={(e) => handleCheckboxChange('notifyOnInvoice', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}
