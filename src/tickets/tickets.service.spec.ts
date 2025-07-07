import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { Company } from '../../db/models/Company';
import { ConflictException } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DbModule } from '../db.module';

import {
  Ticket,
  TicketCategory,
  TicketStatus,
  TicketType,
} from '../../db/models/Ticket';
import { User, UserRole } from '../../db/models/User';

describe('TicketsService', () => {
  let service: TicketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DbModule, SequelizeModule.forFeature([Ticket])],
      providers: [TicketsService],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createManagementReport', () => {
    it('creates managementReport ticket', async () => {
      const company = await Company.create({ name: 'test' });
      const user = await User.create({
        name: 'Test User',
        role: UserRole.accountant,
        companyId: company.id,
      });

      const ticket = await service.createManagementReportTicket(company.id);

      expect(ticket.category).toBe(TicketCategory.accounting);
      expect(ticket.assigneeId).toBe(user.id);
      expect(ticket.status).toBe(TicketStatus.open);
    });

    it('if there are multiple accountants, assign the last one', async () => {
      const company = await Company.create({ name: 'test' });
      await User.create({
        name: 'Test User',
        role: UserRole.accountant,
        companyId: company.id,
      });
      const user2 = await User.create({
        name: 'Test User',
        role: UserRole.accountant,
        companyId: company.id,
      });

      const ticket = await service.createManagementReportTicket(company.id);

      expect(ticket.category).toBe(TicketCategory.accounting);
      expect(ticket.companyId).toBe(company.id);
      expect(ticket.type).toBe(TicketType.managementReport);
      expect(ticket.assigneeId).toBe(user2.id);
      expect(ticket.status).toBe(TicketStatus.open);
    });

    it('if there is no accountant, throw', async () => {
      const company = await Company.create({ name: 'test' });

      await expect(
        service.createManagementReportTicket(company.id),
      ).rejects.toEqual(
        new ConflictException(
          `Cannot find user with role accountant to create a ticket`,
        ),
      );
    });
  });

  describe('createRegisAddrTicket', () => {
    it('if there is exactly 1 secretary, creates registrationAddressChange ticket', async () => {
      const company = await Company.create({ name: 'test' });
      const user = await User.create({
        name: 'Test Secretary',
        role: UserRole.corporateSecretary,
        companyId: company.id,
      });

      const ticket = await service.createRegisAddrChangeTicket(company.id);

      expect(ticket.category).toBe(TicketCategory.corporate);
      expect(ticket.companyId).toBe(company.id);
      expect(ticket.type).toBe(TicketType.registrationAddressChange);
      expect(ticket.assigneeId).toBe(user.id);
      expect(ticket.status).toBe(TicketStatus.open);
    });

    it('if there is already another open registrationAddressChange ticket, throw', async () => {
      const company = await Company.create({ name: 'test' });
      const user = await User.create({
        name: 'Test Director',
        role: UserRole.director,
        companyId: company.id,
      });
      await Ticket.create({
        type: TicketType.registrationAddressChange,
        status: TicketStatus.open,
        companyId: company.id,
        assigneeId: user.id,
      });

      await expect(
        service.createRegisAddrChangeTicket(company.id),
      ).rejects.toEqual(
        new ConflictException(
          `Open ticket with type ${TicketType.registrationAddressChange} already existed for this company`,
        ),
      );
    });

    it('if there is 1 secretary and there is 1 director, creates registrationAddressChange ticket using the secretary (not the director)', async () => {
      const company = await Company.create({ name: 'test' });
      const userSecretary = await User.create({
        name: 'Test Secretary',
        role: UserRole.corporateSecretary,
        companyId: company.id,
      });

      await User.create({
        name: 'Test Director',
        role: UserRole.director,
        companyId: company.id,
      });

      const ticket = await service.createRegisAddrChangeTicket(company.id);

      expect(ticket.category).toBe(TicketCategory.corporate);
      expect(ticket.companyId).toBe(company.id);
      expect(ticket.type).toBe(TicketType.registrationAddressChange);
      expect(ticket.assigneeId).toBe(userSecretary.id);
      expect(ticket.status).toBe(TicketStatus.open);
    });

    it('if there is no secretary and there is 1 director, creates registrationAddressChange ticket', async () => {
      const company = await Company.create({ name: 'test' });
      const user = await User.create({
        name: 'Test Director',
        role: UserRole.director,
        companyId: company.id,
      });

      const ticket = await service.createRegisAddrChangeTicket(company.id);

      expect(ticket.category).toBe(TicketCategory.corporate);
      expect(ticket.companyId).toBe(company.id);
      expect(ticket.type).toBe(TicketType.registrationAddressChange);
      expect(ticket.assigneeId).toBe(user.id);
      expect(ticket.status).toBe(TicketStatus.open);
    });

    it('if there is 1 secretary and there is 1 director, creates registrationAddressChange ticket using the secretary (not the director)', async () => {
      const company = await Company.create({ name: 'test' });
      const userSecretary = await User.create({
        name: 'Test Secretary',
        role: UserRole.corporateSecretary,
        companyId: company.id,
      });

      await User.create({
        name: 'Test Director',
        role: UserRole.director,
        companyId: company.id,
      });

      const ticket = await service.createRegisAddrChangeTicket(company.id);

      expect(ticket.category).toBe(TicketCategory.corporate);
      expect(ticket.companyId).toBe(company.id);
      expect(ticket.type).toBe(TicketType.registrationAddressChange);
      expect(ticket.assigneeId).toBe(userSecretary.id);
      expect(ticket.status).toBe(TicketStatus.open);
    });

    it('if there are multiple secretaries, throw', async () => {
      const company = await Company.create({ name: 'test' });
      await User.create({
        name: 'Test User',
        role: UserRole.corporateSecretary,
        companyId: company.id,
      });
      await User.create({
        name: 'Test User',
        role: UserRole.corporateSecretary,
        companyId: company.id,
      });

      await expect(
        service.createRegisAddrChangeTicket(company.id),
      ).rejects.toEqual(
        new ConflictException(
          `Multiple users with role corporateSecretary. Cannot create a ticket`,
        ),
      );
    });

    it('if there is no secretaries but multiple directors, throw', async () => {
      const company = await Company.create({ name: 'test' });
      await User.create({
        name: 'Test Director',
        role: UserRole.director,
        companyId: company.id,
      });
      await User.create({
        name: 'Test Director',
        role: UserRole.director,
        companyId: company.id,
      });

      await expect(
        service.createRegisAddrChangeTicket(company.id),
      ).rejects.toEqual(
        new ConflictException(
          `Multiple users with role director. Cannot create a ticket`,
        ),
      );
    });

    it('if there is no secretary or director, throw', async () => {
      const company = await Company.create({ name: 'test' });

      await expect(
        service.createRegisAddrChangeTicket(company.id),
      ).rejects.toEqual(
        new ConflictException(
          `Cannot find user with role corporateSecretary or director to create a ticket`,
        ),
      );
    });
  });

  describe('createStrikeOffTicket', () => {
    it('if there is exactly 1 director, creates strikeOff ticket and resolve all other ticket from the company', async () => {
      const company = await Company.create({ name: 'test' });
      const userDirector = await User.create({
        name: 'Test Director',
        role: UserRole.director,
        companyId: company.id,
      });

      const userAccountant = await User.create({
        name: 'Test Accountant',
        role: UserRole.accountant,
        companyId: company.id,
      });

      await Ticket.create({
        type: TicketType.registrationAddressChange,
        status: TicketStatus.open,
        companyId: company.id,
        assigneeId: userDirector.id,
      });

      await Ticket.create({
        type: TicketType.registrationAddressChange,
        status: TicketStatus.open,
        companyId: company.id,
        assigneeId: userDirector.id,
      });

      await Ticket.create({
        type: TicketType.managementReport,
        status: TicketStatus.open,
        companyId: company.id,
        assigneeId: userAccountant.id,
      });

      const ticket = await service.createStrikeOffTicket(company.id);

      const resolvedTicketsCount = await Ticket.count({
        where: { companyId: company.id, status: TicketStatus.resolved },
      });

      expect(ticket.category).toBe(TicketCategory.management);
      expect(ticket.companyId).toBe(company.id);
      expect(ticket.type).toBe(TicketType.strikeOff);
      expect(ticket.assigneeId).toBe(userDirector.id);
      expect(ticket.status).toBe(TicketStatus.open);

      expect(resolvedTicketsCount).toBe(3);
    });

    it('if there are multiple directors, throw', async () => {
      const company = await Company.create({ name: 'test' });
      await User.create({
        name: 'Test User',
        role: UserRole.director,
        companyId: company.id,
      });
      await User.create({
        name: 'Test User',
        role: UserRole.director,
        companyId: company.id,
      });

      await expect(service.createStrikeOffTicket(company.id)).rejects.toEqual(
        new ConflictException(
          `Multiple users with role director. Cannot create a ticket`,
        ),
      );
    });

    it('if there is no director, throw', async () => {
      const company = await Company.create({ name: 'test' });

      await expect(service.createStrikeOffTicket(company.id)).rejects.toEqual(
        new ConflictException(
          `Cannot find user with role director to create a ticket`,
        ),
      );
    });
  });
});
