'use client';

import { useState, useEffect } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Contact } from '@united-cars/crm-core';

interface ContactsMultiSelectProps {
  value: string[];
  onValueChange: (ids: string[]) => void;
  organisationId?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function ContactsMultiSelect({
  value,
  onValueChange,
  organisationId,
  placeholder = "Select contacts...",
  disabled = false
}: ContactsMultiSelectProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch contacts
  useEffect(() => {
    const loadContacts = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/crm/contacts');
        if (response.ok) {
          const data = await response.json();
          setContacts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to load contacts:', error);
      } finally {
        setLoading(false);
      }
    };
    loadContacts();
  }, []);

  // Filter contacts by organisation if provided
  const filteredContacts = organisationId
    ? contacts.filter(c => c.organisationId === organisationId)
    : contacts;

  // Toggle selection
  const handleToggle = (contactId: string) => {
    if (value.includes(contactId)) {
      onValueChange(value.filter(id => id !== contactId));
    } else {
      onValueChange([...value, contactId]);
    }
  };

  // Get selected contacts for display
  const selectedContacts = contacts.filter(c => value.includes(c.id));
  const selectedCount = value.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedCount > 0 ? (
            <span className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {selectedCount}
              </Badge>
              {selectedCount === 1
                ? `${selectedContacts[0]?.firstName} ${selectedContacts[0]?.lastName}`
                : `${selectedCount} contacts selected`}
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[400px] p-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading contacts...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {organisationId ? 'No contacts in this organisation' : 'No contacts available'}
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredContacts.map((contact) => (
              <div key={contact.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`contact-${contact.id}`}
                  checked={value.includes(contact.id)}
                  onCheckedChange={() => handleToggle(contact.id)}
                />
                <label
                  htmlFor={`contact-${contact.id}`}
                  className="text-sm font-normal leading-none cursor-pointer flex-1"
                >
                  {contact.firstName} {contact.lastName}
                  {!organisationId && contact.organisationId && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Organisation ID: {contact.organisationId})
                    </span>
                  )}
                </label>
              </div>
            ))}
          </div>
        )}

        {selectedCount > 0 && (
          <div className="pt-3 border-t mt-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onValueChange([])}
            >
              Clear all ({selectedCount})
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
