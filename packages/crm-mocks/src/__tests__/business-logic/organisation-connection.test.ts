import { describe, it, expect, beforeEach } from 'vitest';
import { organisationConnectionRepository } from '../../repositories/organisation-connection-repository';
import { organisationRepository } from '../../repositories/organisation-repository';
import { OrganisationRelationType, OrganizationType } from '@united-cars/crm-core';

describe('Organisation Connection Business Logic', () => {
  // Helper to create test organisations
  const createTestOrganisations = async () => {
    const dealer = await organisationRepository.create({
      name: `Test Dealer - ${Date.now()}`,
      type: OrganizationType.DEALER
    } as any);

    const shipper = await organisationRepository.create({
      name: `Test Shipper - ${Date.now()}`,
      type: OrganizationType.SHIPPER
    } as any);

    const auction = await organisationRepository.create({
      name: `Test Auction - ${Date.now()}`,
      type: OrganizationType.AUCTION
    } as any);

    return { dealer, shipper, auction };
  };

  describe('B6 Fix: Bidirectional Duplicate Prevention', () => {
    it('should prevent creating A->B connection when it already exists', async () => {
      const { dealer, shipper } = await createTestOrganisations();

      // Create first connection
      const connection1 = await organisationConnectionRepository.createConnection(
        dealer.id,
        shipper.id,
        OrganisationRelationType.SHIPPER_DEALER,
        { description: 'First connection' }
      );
      expect(connection1).toBeDefined();

      // Try to create same connection again
      await expect(
        organisationConnectionRepository.createConnection(
          dealer.id,
          shipper.id,
          OrganisationRelationType.SHIPPER_DEALER,
          { description: 'Duplicate connection' }
        )
      ).rejects.toThrow('Connection already exists');
    });

    it('should prevent creating B->A connection when A->B already exists', async () => {
      const { dealer, shipper } = await createTestOrganisations();

      // Create A->B connection
      const connection1 = await organisationConnectionRepository.createConnection(
        dealer.id,
        shipper.id,
        OrganisationRelationType.SHIPPER_DEALER,
        { description: 'Dealer to Shipper' }
      );
      expect(connection1).toBeDefined();

      // Try to create B->A connection (reverse direction)
      await expect(
        organisationConnectionRepository.createConnection(
          shipper.id,
          dealer.id,
          OrganisationRelationType.SHIPPER_DEALER,
          { description: 'Shipper to Dealer (reverse)' }
        )
      ).rejects.toThrow('Connection already exists');
    });

    it('should allow connections of different types between same orgs', async () => {
      const { dealer, auction } = await createTestOrganisations();

      // Create first connection type
      const connection1 = await organisationConnectionRepository.createConnection(
        dealer.id,
        auction.id,
        OrganisationRelationType.AUCTION_DEALER,
        { description: 'Auction-Dealer relationship' }
      );
      expect(connection1).toBeDefined();

      // Create different connection type between same orgs
      const connection2 = await organisationConnectionRepository.createConnection(
        dealer.id,
        auction.id,
        OrganisationRelationType.PARTNER,
        { description: 'Partner relationship' }
      );
      expect(connection2).toBeDefined();
      expect(connection2.id).not.toBe(connection1.id);
    });

    it('should prevent self-connections', async () => {
      const { dealer } = await createTestOrganisations();

      await expect(
        organisationConnectionRepository.createConnection(
          dealer.id,
          dealer.id,
          OrganisationRelationType.PARTNER,
          { description: 'Self connection' }
        )
      ).rejects.toThrow('Cannot create a connection from an organisation to itself');
    });
  });

  describe('Connection CRUD Operations', () => {
    it('should create connection with all options', async () => {
      const { dealer, shipper } = await createTestOrganisations();
      const startDate = new Date();
      const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      const connection = await organisationConnectionRepository.createConnection(
        dealer.id,
        shipper.id,
        OrganisationRelationType.SHIPPER_DEALER,
        {
          description: 'Full connection',
          startDate,
          endDate,
          metadata: { contractId: 'contract-123' }
        }
      );

      expect(connection.fromOrganisationId).toBe(dealer.id);
      expect(connection.toOrganisationId).toBe(shipper.id);
      expect(connection.type).toBe(OrganisationRelationType.SHIPPER_DEALER);
      expect(connection.description).toBe('Full connection');
      expect(connection.isActive).toBe(true);
      expect(connection.startDate).toEqual(startDate);
      expect(connection.endDate).toEqual(endDate);
      expect(connection.metadata).toEqual({ contractId: 'contract-123' });
    });

    it('should deactivate connection', async () => {
      const { dealer, shipper } = await createTestOrganisations();

      const connection = await organisationConnectionRepository.createConnection(
        dealer.id,
        shipper.id,
        OrganisationRelationType.SHIPPER_DEALER
      );

      const deactivated = await organisationConnectionRepository.deactivateConnection(connection.id);

      expect(deactivated).toBeDefined();
      expect(deactivated?.isActive).toBe(false);
    });

    it('should reactivate connection', async () => {
      const { dealer, shipper } = await createTestOrganisations();

      const connection = await organisationConnectionRepository.createConnection(
        dealer.id,
        shipper.id,
        OrganisationRelationType.SHIPPER_DEALER
      );

      // Deactivate first
      await organisationConnectionRepository.deactivateConnection(connection.id);

      // Then reactivate
      const reactivated = await organisationConnectionRepository.reactivateConnection(connection.id);

      expect(reactivated).toBeDefined();
      expect(reactivated?.isActive).toBe(true);
    });
  });

  describe('Connection Queries', () => {
    it('should find connection in either direction', async () => {
      const { dealer, shipper } = await createTestOrganisations();

      await organisationConnectionRepository.createConnection(
        dealer.id,
        shipper.id,
        OrganisationRelationType.SHIPPER_DEALER
      );

      // Find A->B
      const connection1 = await organisationConnectionRepository.findConnection(
        dealer.id,
        shipper.id,
        OrganisationRelationType.SHIPPER_DEALER
      );
      expect(connection1).toBeDefined();

      // Find B->A (reverse lookup should also work)
      const connection2 = await organisationConnectionRepository.findConnection(
        shipper.id,
        dealer.id,
        OrganisationRelationType.SHIPPER_DEALER
      );
      expect(connection2).toBeDefined();
      expect(connection2?.id).toBe(connection1?.id);
    });

    it('should get all connections for organisation', async () => {
      const { dealer, shipper, auction } = await createTestOrganisations();

      // Create multiple connections for dealer
      await organisationConnectionRepository.createConnection(
        dealer.id,
        shipper.id,
        OrganisationRelationType.SHIPPER_DEALER
      );

      await organisationConnectionRepository.createConnection(
        dealer.id,
        auction.id,
        OrganisationRelationType.AUCTION_DEALER
      );

      const connections = await organisationConnectionRepository.getConnectionsForOrganisation(dealer.id);

      expect(connections.length).toBeGreaterThanOrEqual(2);
    });

    it('should get outgoing connections only', async () => {
      const { dealer, shipper } = await createTestOrganisations();

      await organisationConnectionRepository.createConnection(
        dealer.id,
        shipper.id,
        OrganisationRelationType.SHIPPER_DEALER
      );

      const outgoing = await organisationConnectionRepository.getOutgoingConnections(dealer.id);
      const incoming = await organisationConnectionRepository.getIncomingConnections(dealer.id);

      // Dealer should have outgoing to shipper
      expect(outgoing.some(c => c.toOrganisationId === shipper.id)).toBe(true);

      // Shipper should have incoming from dealer
      const shipperIncoming = await organisationConnectionRepository.getIncomingConnections(shipper.id);
      expect(shipperIncoming.some(c => c.fromOrganisationId === dealer.id)).toBe(true);
    });

    it('should get connections by type', async () => {
      const { dealer, shipper, auction } = await createTestOrganisations();

      await organisationConnectionRepository.createConnection(
        dealer.id,
        shipper.id,
        OrganisationRelationType.SHIPPER_DEALER
      );

      await organisationConnectionRepository.createConnection(
        dealer.id,
        auction.id,
        OrganisationRelationType.PARTNER
      );

      const shipperDealerConnections = await organisationConnectionRepository.getConnectionsByType(
        OrganisationRelationType.SHIPPER_DEALER
      );

      shipperDealerConnections.forEach(c => {
        expect(c.type).toBe(OrganisationRelationType.SHIPPER_DEALER);
      });
    });

    it('should not return deactivated connections in active queries', async () => {
      const { dealer, shipper } = await createTestOrganisations();

      const connection = await organisationConnectionRepository.createConnection(
        dealer.id,
        shipper.id,
        OrganisationRelationType.SHIPPER_DEALER
      );

      // Deactivate
      await organisationConnectionRepository.deactivateConnection(connection.id);

      // Should not appear in active connections
      const activeConnections = await organisationConnectionRepository.getConnectionsForOrganisation(dealer.id);
      expect(activeConnections.find(c => c.id === connection.id)).toBeUndefined();
    });
  });

  describe('Connection Statistics', () => {
    it('should calculate connection stats correctly', async () => {
      const { dealer, shipper, auction } = await createTestOrganisations();

      // Create various connections
      await organisationConnectionRepository.createConnection(
        dealer.id,
        shipper.id,
        OrganisationRelationType.SHIPPER_DEALER
      );

      await organisationConnectionRepository.createConnection(
        dealer.id,
        auction.id,
        OrganisationRelationType.PARTNER
      );

      const stats = await organisationConnectionRepository.getConnectionStats(dealer.id);

      expect(stats.totalConnections).toBeGreaterThanOrEqual(2);
      expect(stats.activeConnections).toBeGreaterThanOrEqual(2);
      expect(stats.connectionsByType).toBeDefined();
      expect(stats.partnerCount).toBeGreaterThanOrEqual(1);
    });
  });
});
