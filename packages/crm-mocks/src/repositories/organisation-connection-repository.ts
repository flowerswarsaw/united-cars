import { OrganisationConnection, OrganisationRelationType } from '@united-cars/crm-core';
import { BaseRepository } from '../base-repository';

export class OrganisationConnectionRepository extends BaseRepository<OrganisationConnection> {
  
  async getConnectionsForOrganisation(orgId: string): Promise<OrganisationConnection[]> {
    const all = await this.list();
    return all.filter(conn => 
      (conn.fromOrganisationId === orgId || conn.toOrganisationId === orgId) && 
      conn.isActive
    );
  }

  async getOutgoingConnections(orgId: string): Promise<OrganisationConnection[]> {
    const all = await this.list();
    return all.filter(conn => conn.fromOrganisationId === orgId && conn.isActive);
  }

  async getIncomingConnections(orgId: string): Promise<OrganisationConnection[]> {
    const all = await this.list();
    return all.filter(conn => conn.toOrganisationId === orgId && conn.isActive);
  }

  async getConnectionsByType(type: OrganisationRelationType): Promise<OrganisationConnection[]> {
    const all = await this.list();
    return all.filter(conn => conn.type === type && conn.isActive);
  }

  async findConnection(fromOrgId: string, toOrgId: string, type?: OrganisationRelationType): Promise<OrganisationConnection | null> {
    const all = await this.list();
    return all.find(conn => {
      const matchesOrgs = (
        (conn.fromOrganisationId === fromOrgId && conn.toOrganisationId === toOrgId) ||
        (conn.fromOrganisationId === toOrgId && conn.toOrganisationId === fromOrgId)
      );
      const matchesType = type ? conn.type === type : true;
      return matchesOrgs && matchesType && conn.isActive;
    }) || null;
  }

  async createConnection(
    fromOrgId: string, 
    toOrgId: string, 
    type: OrganisationRelationType,
    options: {
      description?: string;
      startDate?: Date;
      endDate?: Date;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<OrganisationConnection> {
    const connection = {
      fromOrganisationId: fromOrgId,
      toOrganisationId: toOrgId,
      type,
      description: options.description,
      isActive: true,
      startDate: options.startDate,
      endDate: options.endDate,
      metadata: options.metadata
    };

    return await this.create(connection as Omit<OrganisationConnection, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>);
  }

  async deactivateConnection(connectionId: string): Promise<OrganisationConnection | null> {
    return (await this.update(connectionId, { isActive: false })) || null;
  }

  async reactivateConnection(connectionId: string): Promise<OrganisationConnection | null> {
    return (await this.update(connectionId, { isActive: true })) || null;
  }

  async getPartnerOrganisations(orgId: string): Promise<OrganisationConnection[]> {
    return await this.getConnectionsByTypeForOrg(orgId, OrganisationRelationType.PARTNER);
  }

  async getShipperDealerConnections(orgId: string): Promise<OrganisationConnection[]> {
    return await this.getConnectionsByTypeForOrg(orgId, OrganisationRelationType.SHIPPER_DEALER);
  }

  async getAuctionDealerConnections(orgId: string): Promise<OrganisationConnection[]> {
    return await this.getConnectionsByTypeForOrg(orgId, OrganisationRelationType.AUCTION_DEALER);
  }

  private async getConnectionsByTypeForOrg(orgId: string, type: OrganisationRelationType): Promise<OrganisationConnection[]> {
    const all = await this.list();
    return all.filter(conn => 
      (conn.fromOrganisationId === orgId || conn.toOrganisationId === orgId) && 
      conn.type === type && 
      conn.isActive
    );
  }

  async getConnectionStats(orgId: string): Promise<{
    totalConnections: number;
    activeConnections: number;
    connectionsByType: Record<OrganisationRelationType, number>;
    partnerCount: number;
    clientCount: number;
    vendorCount: number;
  }> {
    const connections = await this.getConnectionsForOrganisation(orgId);
    const allConnections = await this.list();
    const orgConnections = allConnections.filter(conn => 
      conn.fromOrganisationId === orgId || conn.toOrganisationId === orgId
    );

    const connectionsByType = {} as Record<OrganisationRelationType, number>;
    Object.values(OrganisationRelationType).forEach(type => {
      connectionsByType[type] = connections.filter(conn => conn.type === type).length;
    });

    return {
      totalConnections: orgConnections.length,
      activeConnections: connections.length,
      connectionsByType,
      partnerCount: connectionsByType[OrganisationRelationType.PARTNER] || 0,
      clientCount: connectionsByType[OrganisationRelationType.CLIENT] || 0,
      vendorCount: connectionsByType[OrganisationRelationType.VENDOR] || 0
    };
  }
}

export const organisationConnectionRepository = new OrganisationConnectionRepository();