import { promises as fs } from 'fs';
import * as path from 'path';
import { 
  enhancedOrganisationRepository,
  enhancedContactRepository, 
  enhancedDealRepository,
  enhancedLeadRepository
} from './repositories';
import { uniquenessManager } from '@united-cars/crm-core/src/uniqueness';
import { historyLogger } from '@united-cars/crm-core/src/history';

const DATA_DIR = path.join(process.cwd(), '.crm-data');
const DATA_FILE = path.join(DATA_DIR, 'enhanced-data.json');

interface EnhancedCRMData {
  organisations: any[];
  contacts: any[];
  deals: any[];
  leads: any[];
  uniquenessConstraints: any[];
  historyEntries: any[];
  metadata: {
    version: string;
    lastSaved: string;
    totalRecords: number;
  };
}

export class EnhancedJSONPersistenceAdapter {
  private isEnabled = process.env.NODE_ENV !== 'production';
  private readonly version = '2.0.0';

  async save(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await fs.mkdir(DATA_DIR, { recursive: true });

      const data: EnhancedCRMData = {
        organisations: enhancedOrganisationRepository.toJSON(),
        contacts: enhancedContactRepository.toJSON(),
        deals: enhancedDealRepository.toJSON(),
        leads: enhancedLeadRepository.toJSON(),
        uniquenessConstraints: uniquenessManager.toJSON(),
        historyEntries: historyLogger.toJSON(),
        metadata: {
          version: this.version,
          lastSaved: new Date().toISOString(),
          totalRecords: this.getTotalRecordCount()
        }
      };

      await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
      console.log(`Enhanced CRM data saved: ${data.metadata.totalRecords} records`);
    } catch (error) {
      console.error('Failed to save enhanced CRM data:', error);
    }
  }

  async load(): Promise<boolean> {
    if (!this.isEnabled) return false;

    try {
      const dataStr = await fs.readFile(DATA_FILE, 'utf-8');
      const data = JSON.parse(dataStr) as EnhancedCRMData;

      // Check version compatibility
      if (data.metadata?.version && this.isVersionCompatible(data.metadata.version)) {
        console.log(`Loading enhanced CRM data version ${data.metadata.version}`);
      } else {
        console.warn('Enhanced CRM data version mismatch, attempting migration...');
        await this.migrateData(data);
      }

      // Load repository data
      enhancedOrganisationRepository.fromJSON(data.organisations || []);
      enhancedContactRepository.fromJSON(data.contacts || []);
      enhancedDealRepository.fromJSON(data.deals || []);
      enhancedLeadRepository.fromJSON(data.leads || []);

      // Load uniqueness constraints
      if (data.uniquenessConstraints) {
        uniquenessManager.fromJSON(data.uniquenessConstraints);
      }

      // Load history entries
      if (data.historyEntries) {
        historyLogger.fromJSON(data.historyEntries);
      }

      console.log(`Enhanced CRM data loaded: ${data.metadata?.totalRecords || 0} records`);
      return true;
    } catch (error) {
      console.warn('Failed to load enhanced CRM data, will use defaults:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await fs.unlink(DATA_FILE);
      console.log('Enhanced CRM data cleared');
    } catch (error) {
      // File might not exist
    }
  }

  async backup(): Promise<string> {
    if (!this.isEnabled) throw new Error('Backups disabled in production');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(DATA_DIR, `backup-${timestamp}.json`);

    try {
      const dataStr = await fs.readFile(DATA_FILE, 'utf-8');
      await fs.writeFile(backupFile, dataStr);
      console.log(`Enhanced CRM data backed up to: ${backupFile}`);
      return backupFile;
    } catch (error) {
      throw new Error(`Failed to create backup: ${error}`);
    }
  }

  async restore(backupFile: string): Promise<void> {
    if (!this.isEnabled) throw new Error('Restore disabled in production');

    try {
      const backupStr = await fs.readFile(backupFile, 'utf-8');
      await fs.writeFile(DATA_FILE, backupStr);
      
      // Reload the data
      await this.load();
      console.log(`Enhanced CRM data restored from: ${backupFile}`);
    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error}`);
    }
  }

  async getDataStatistics(): Promise<{
    totalRecords: number;
    organisations: number;
    contacts: number;
    deals: number;
    leads: number;
    uniquenessConstraints: number;
    historyEntries: number;
    lastSaved?: string;
    dataSize: string;
  }> {
    const stats = {
      totalRecords: this.getTotalRecordCount(),
      organisations: enhancedOrganisationRepository.toJSON().length,
      contacts: enhancedContactRepository.toJSON().length,
      deals: enhancedDealRepository.toJSON().length,
      leads: enhancedLeadRepository.toJSON().length,
      uniquenessConstraints: uniquenessManager.getAllConstraints().length,
      historyEntries: historyLogger.getStatistics().totalEntries,
      lastSaved: undefined as string | undefined,
      dataSize: '0 KB'
    };

    try {
      const fileStat = await fs.stat(DATA_FILE);
      stats.dataSize = `${Math.round(fileStat.size / 1024)} KB`;

      const dataStr = await fs.readFile(DATA_FILE, 'utf-8');
      const data = JSON.parse(dataStr) as EnhancedCRMData;
      stats.lastSaved = data.metadata?.lastSaved;
    } catch (error) {
      // File doesn't exist or other error
    }

    return stats;
  }

  async validateDataIntegrity(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    repaired: string[];
  }> {
    const result = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      repaired: [] as string[]
    };

    try {
      // Validate uniqueness constraints integrity
      const uniquenessIntegrity = uniquenessManager.verifyIntegrity();
      if (!uniquenessIntegrity.valid) {
        result.isValid = false;
        result.errors.push(`Corrupted uniqueness constraints: ${uniquenessIntegrity.corruptedEntries.join(', ')}`);
      }

      // Validate history integrity
      const historyIntegrity = historyLogger.verifyIntegrity();
      if (!historyIntegrity.valid) {
        result.isValid = false;
        result.errors.push(`Corrupted history entries: ${historyIntegrity.corruptedEntries.join(', ')}`);
      }

      // Check for orphaned records
      const organisations = enhancedOrganisationRepository.toJSON();
      const contacts = enhancedContactRepository.toJSON();
      const deals = enhancedDealRepository.toJSON();
      const leads = enhancedLeadRepository.toJSON();

      const orgIds = new Set(organisations.map(o => o.id));
      const contactIds = new Set(contacts.map(c => c.id));

      // Check for contacts with invalid organisation references
      const orphanedContacts = contacts.filter(c => c.organisationId && !orgIds.has(c.organisationId));
      if (orphanedContacts.length > 0) {
        result.warnings.push(`Found ${orphanedContacts.length} contacts with invalid organisation references`);
      }

      // Check for deals with invalid organisation/contact references
      const orphanedDeals = deals.filter(d => 
        (d.organisationId && !orgIds.has(d.organisationId)) ||
        (d.contactId && !contactIds.has(d.contactId))
      );
      if (orphanedDeals.length > 0) {
        result.warnings.push(`Found ${orphanedDeals.length} deals with invalid references`);
      }

      // Check for leads without proper assignment
      const unassignedLeads = leads.filter(l => !l.assignedUserId);
      if (unassignedLeads.length > 0) {
        result.warnings.push(`Found ${unassignedLeads.length} leads without assignment`);
      }

      console.log('Data integrity validation completed');
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation failed: ${error}`);
    }

    return result;
  }

  // Private helper methods
  private getTotalRecordCount(): number {
    return (
      enhancedOrganisationRepository.toJSON().length +
      enhancedContactRepository.toJSON().length +
      enhancedDealRepository.toJSON().length +
      enhancedLeadRepository.toJSON().length
    );
  }

  private isVersionCompatible(version: string): boolean {
    const current = this.version.split('.').map(Number);
    const data = version.split('.').map(Number);
    
    // Major version must match, minor version can be backward compatible
    return current[0] === data[0] && current[1] >= data[1];
  }

  private async migrateData(data: any): Promise<void> {
    console.log('Migrating enhanced CRM data...');
    
    // Add migration logic here as the system evolves
    // For now, we'll just ensure all required fields are present
    
    if (!data.uniquenessConstraints) {
      data.uniquenessConstraints = [];
    }
    
    if (!data.historyEntries) {
      data.historyEntries = [];
    }
    
    if (!data.metadata) {
      data.metadata = {
        version: this.version,
        lastSaved: new Date().toISOString(),
        totalRecords: 0
      };
    }

    console.log('Data migration completed');
  }
}

export const enhancedJsonPersistence = new EnhancedJSONPersistenceAdapter();

// Client-side localStorage adapter for enhanced data
export class EnhancedLocalStorageAdapter {
  private prefix = 'enhanced_crm_';

  save(key: string, data: any): void {
    if (typeof window === 'undefined') return;
    
    try {
      const serializedData = JSON.stringify({
        data,
        timestamp: Date.now(),
        version: '2.0.0'
      });
      localStorage.setItem(this.prefix + key, serializedData);
    } catch (error) {
      console.error('Failed to save to enhanced localStorage:', error);
    }
  }

  load<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      
      // Check if data is too old (older than 24 hours)
      const age = Date.now() - parsed.timestamp;
      if (age > 24 * 60 * 60 * 1000) {
        this.remove(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error('Failed to load from enhanced localStorage:', error);
      return null;
    }
  }

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
    keys.forEach(key => localStorage.removeItem(key));
  }

  getStorageStats(): {
    totalItems: number;
    totalSize: number;
    items: Array<{ key: string; size: number; age: number }>;
  } {
    if (typeof window === 'undefined') {
      return { totalItems: 0, totalSize: 0, items: [] };
    }

    const stats = {
      totalItems: 0,
      totalSize: 0,
      items: [] as Array<{ key: string; size: number; age: number }>
    };

    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
    
    for (const key of keys) {
      const item = localStorage.getItem(key);
      if (item) {
        const size = new Blob([item]).size;
        let age = 0;
        
        try {
          const parsed = JSON.parse(item);
          age = Date.now() - parsed.timestamp;
        } catch (error) {
          // Invalid format
        }

        stats.totalItems++;
        stats.totalSize += size;
        stats.items.push({
          key: key.replace(this.prefix, ''),
          size,
          age
        });
      }
    }

    return stats;
  }
}

export const enhancedLocalStorageAdapter = new EnhancedLocalStorageAdapter();