import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { 
  Organisation, 
  Contact, 
  Lead, 
  Deal, 
  Pipeline,
  PaginatedResult,
  ListQuery,
  LossReason
} from '@united-cars/crm-core';

// Query Keys
export const crmQueryKeys = {
  all: ['crm'] as const,
  organisations: () => [...crmQueryKeys.all, 'organisations'] as const,
  organisation: (id: string) => [...crmQueryKeys.organisations(), id] as const,
  contacts: () => [...crmQueryKeys.all, 'contacts'] as const,
  contact: (id: string) => [...crmQueryKeys.contacts(), id] as const,
  contactsByOrg: (orgId: string) => [...crmQueryKeys.contacts(), 'by-org', orgId] as const,
  leads: () => [...crmQueryKeys.all, 'leads'] as const,
  lead: (id: string) => [...crmQueryKeys.leads(), id] as const,
  deals: () => [...crmQueryKeys.all, 'deals'] as const,
  deal: (id: string) => [...crmQueryKeys.deals(), id] as const,
  dealsByPipeline: (pipelineId: string, stageId?: string) => 
    [...crmQueryKeys.deals(), 'by-pipeline', pipelineId, stageId] as const,
  pipelines: () => [...crmQueryKeys.all, 'pipelines'] as const,
  pipeline: (id: string) => [...crmQueryKeys.pipelines(), id] as const,
};

// API Base URL
const API_BASE = '/api/crm';

// Generic API client
async function crmFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Organizations Hooks
export function useOrganisations() {
  return useQuery({
    queryKey: crmQueryKeys.organisations(),
    queryFn: () => crmFetch<Organisation[]>('/organisations'),
  });
}

export function useOrganisation(id: string) {
  return useQuery({
    queryKey: crmQueryKeys.organisation(id),
    queryFn: () => crmFetch<Organisation>(`/organisations/${id}`),
    enabled: !!id,
  });
}

export function useCreateOrganisation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Organisation, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) =>
      crmFetch<Organisation>('/organisations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.organisations() });
    },
  });
}

export function useUpdateOrganisation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Organisation> }) =>
      crmFetch<Organisation>(`/organisations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.organisation(id) });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.organisations() });
    },
  });
}

// Contacts Hooks
export function useContacts() {
  return useQuery({
    queryKey: crmQueryKeys.contacts(),
    queryFn: () => crmFetch<Contact[]>('/contacts'),
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: crmQueryKeys.contact(id),
    queryFn: () => crmFetch<Contact>(`/contacts/${id}`),
    enabled: !!id,
  });
}

export function useContactsByOrganisation(orgId: string) {
  return useQuery({
    queryKey: crmQueryKeys.contactsByOrg(orgId),
    queryFn: () => crmFetch<Contact[]>(`/contacts?organisationId=${orgId}`),
    enabled: !!orgId,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Contact, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) =>
      crmFetch<Contact>('/contacts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (newContact) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.contacts() });
      if (newContact.organisationId) {
        queryClient.invalidateQueries({ 
          queryKey: crmQueryKeys.contactsByOrg(newContact.organisationId) 
        });
      }
    },
  });
}

// Leads Hooks
export function useLeads() {
  return useQuery({
    queryKey: crmQueryKeys.leads(),
    queryFn: () => crmFetch<Lead[]>('/leads'),
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: crmQueryKeys.lead(id),
    queryFn: () => crmFetch<Lead>(`/leads/${id}`),
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Lead, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) =>
      crmFetch<Lead>('/leads', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.leads() });
    },
  });
}

export function useConvertLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      leadId, 
      conversionData 
    }: { 
      leadId: string; 
      conversionData: {
        title: string;
        amount?: number;
        currency?: string;
        pipelineId?: string;
        notes?: string;
        assigneeId?: string;
      }
    }) =>
      crmFetch<Deal>(`/leads/${leadId}/convert`, {
        method: 'POST',
        body: JSON.stringify(conversionData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.leads() });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.deals() });
    },
  });
}

// Deals Hooks
export function useDeals() {
  return useQuery({
    queryKey: crmQueryKeys.deals(),
    queryFn: () => crmFetch<Deal[]>('/deals'),
  });
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: crmQueryKeys.deal(id),
    queryFn: () => crmFetch<Deal>(`/deals/${id}`),
    enabled: !!id,
  });
}

export function useDealsByPipeline(pipelineId: string, stageId?: string) {
  return useQuery({
    queryKey: crmQueryKeys.dealsByPipeline(pipelineId, stageId),
    queryFn: () => {
      const url = `/deals?pipelineId=${pipelineId}${stageId ? `&stageId=${stageId}` : ''}`;
      return crmFetch<Deal[]>(url);
    },
    enabled: !!pipelineId,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<Deal, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) =>
      crmFetch<Deal>('/deals', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.deals() });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Deal> }) =>
      crmFetch<Deal>(`/deals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.deal(id) });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.deals() });
    },
  });
}

export function useMoveDealStage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      dealId, 
      pipelineId, 
      toStageId, 
      note, 
      lossReason 
    }: {
      dealId: string;
      pipelineId: string;
      toStageId: string;
      note?: string;
      lossReason?: LossReason;
    }) =>
      crmFetch<Deal>(`/deals/${dealId}/move-stage`, {
        method: 'POST',
        body: JSON.stringify({ pipelineId, toStageId, note, lossReason }),
      }),
    onSuccess: (_, { dealId }) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.deal(dealId) });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.deals() });
    },
  });
}

// Pipelines Hooks
export function usePipelines() {
  return useQuery({
    queryKey: crmQueryKeys.pipelines(),
    queryFn: () => crmFetch<Pipeline[]>('/pipelines'),
  });
}

export function usePipeline(id: string) {
  return useQuery({
    queryKey: crmQueryKeys.pipeline(id),
    queryFn: () => crmFetch<Pipeline>(`/pipelines/${id}`),
    enabled: !!id,
  });
}