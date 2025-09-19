import { promises as fs } from 'fs';
import * as path from 'path';
import {
  organisationRepository,
  organisationConnectionRepository,
  contactRepository,
  leadRepository,
  dealRepository,
  pipelineRepository,
  taskRepository,
  customFieldRepository,
  activityRepository
} from './seeds';
import { changeLogRepository } from './repositories/change-log-repository';

const DATA_DIR = path.join(process.cwd(), '.crm-data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

interface CRMData {
  organisations: any[];
  organisationConnections: any[];
  contacts: any[];
  leads: any[];
  deals: any[];
  pipelines: any[];
  stages: any[];
  tasks: any[];
  customFields: {
    fieldDefs: any[];
    fieldValues: any[];
  };
  activities: any[];
  changeLogs: any[];
}

export class JSONPersistenceAdapter {
  private isEnabled = process.env.NODE_ENV !== 'production';

  async save(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await fs.mkdir(DATA_DIR, { recursive: true });

      const data: CRMData = {
        organisations: organisationRepository.toJSON(),
        organisationConnections: organisationConnectionRepository.toJSON(),
        contacts: contactRepository.toJSON(),
        leads: leadRepository.toJSON(),
        deals: dealRepository.toJSON(),
        pipelines: pipelineRepository.toJSON(),
        stages: pipelineRepository.stagesToJSON(),
        tasks: taskRepository.toJSON(),
        customFields: customFieldRepository.toJSON(),
        activities: activityRepository.toJSON(),
        changeLogs: changeLogRepository.toJSON()
      };

      await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save CRM data:', error);
    }
  }

  async load(): Promise<boolean> {
    if (!this.isEnabled) return false;

    try {
      const dataStr = await fs.readFile(DATA_FILE, 'utf-8');
      const data = JSON.parse(dataStr) as CRMData;

      organisationRepository.fromJSON(data.organisations);
      organisationConnectionRepository.fromJSON(data.organisationConnections || []);
      contactRepository.fromJSON(data.contacts);
      leadRepository.fromJSON(data.leads);
      dealRepository.fromJSON(data.deals);
      pipelineRepository.fromJSON(data.pipelines);
      pipelineRepository.stagesFromJSON(data.stages);
      taskRepository.fromJSON(data.tasks);
      customFieldRepository.fromJSON(data.customFields);
      activityRepository.fromJSON(data.activities);
      changeLogRepository.fromJSON(data.changeLogs || []);

      return true;
    } catch (error) {
      return false;
    }
  }

  async clear(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await fs.unlink(DATA_FILE);
    } catch (error) {
      // File might not exist
    }
  }
}

export const jsonPersistence = new JSONPersistenceAdapter();

// Client-side localStorage adapter
export class LocalStorageAdapter {
  private prefix = 'crm_';

  save(key: string, data: any): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  load<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
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
}

export const localStorageAdapter = new LocalStorageAdapter();