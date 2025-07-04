import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Company } from '../../db/models/Company';
import {
  Ticket,
  TicketCategory,
  TicketStatus,
  TicketType,
} from '../../db/models/Ticket';
import { User, UserRole } from '../../db/models/User';
import { DbModule } from '../db.module';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';

describe('TicketsController', () => {
  let controller: TicketsController;

  const mockTicketsService = {
    createManagementReportTicket: jest.fn(),
    createStrikeOffTicket: jest.fn(),
    createRegisAddrChangeTicket: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      imports: [DbModule],
      providers: [
        {
          provide: TicketsService,
          useValue: mockTicketsService,
        },
      ],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
  });

  it('should be defined', async () => {
    expect(controller).toBeDefined();

    const res = await controller.findAll();
    console.log(res);
  });

  describe('findAll', () => {
    it('if successfully return result', async () => {
      const company = await Company.create({ name: 'test' });
      const user = await User.create({
        name: 'Test Director',
        role: UserRole.director,
        companyId: company.id,
      });

      await Ticket.create({
        companyId: company.id,
        assigneeId: user.id,
        category: TicketCategory.management,
        type: TicketType.managementReport,
        status: TicketStatus.open,
      });

      await Ticket.create({
        companyId: company.id,
        assigneeId: user.id,
        category: TicketCategory.management,
        type: TicketType.registrationAddressChange,
        status: TicketStatus.open,
      });

      const tickets = await controller.findAll();

      expect(tickets.length).toBe(2);
    });
  });

  describe('create', () => {
    it('if the service create managementReport successfully', async () => {
      const company = await Company.create({ name: 'test' });
      const user = await User.create({
        name: 'Test User',
        role: UserRole.accountant,
        companyId: company.id,
      });

      const returnedTicketMngt = await Ticket.create({
        companyId: company.id,
        assigneeId: user.id,
        category: TicketCategory.management,
        type: TicketType.managementReport,
        status: TicketStatus.open,
      });

      mockTicketsService.createManagementReportTicket.mockResolvedValue(
        returnedTicketMngt,
      );

      const ticket = await controller.create({
        companyId: company.id,
        type: TicketType.managementReport,
      });

      expect(ticket.category).toBe(TicketCategory.management);
      expect(ticket.assigneeId).toBe(user.id);
      expect(ticket.companyId).toBe(company.id);
      expect(ticket.type).toBe(TicketType.managementReport);
      expect(ticket.status).toBe(TicketStatus.open);
    });

    it('if the service create strikeOff successfully', async () => {
      const company = await Company.create({ name: 'test' });
      const user = await User.create({
        name: 'Test User',
        role: UserRole.director,
        companyId: company.id,
      });

      const returnedTicketStrikeOff = await Ticket.create({
        companyId: company.id,
        assigneeId: user.id,
        category: TicketCategory.management,
        type: TicketType.strikeOff,
        status: TicketStatus.open,
      });

      mockTicketsService.createStrikeOffTicket.mockResolvedValue(
        returnedTicketStrikeOff,
      );

      const ticket = await controller.create({
        companyId: company.id,
        type: TicketType.strikeOff,
      });

      expect(ticket.category).toBe(TicketCategory.management);
      expect(ticket.assigneeId).toBe(user.id);
      expect(ticket.companyId).toBe(company.id);
      expect(ticket.type).toBe(TicketType.strikeOff);
      expect(ticket.status).toBe(TicketStatus.open);
    });

    it('if the service create registration address ticket successfully', async () => {
      const company = await Company.create({ name: 'test' });
      const user = await User.create({
        name: 'Test User',
        role: UserRole.corporateSecretary,
        companyId: company.id,
      });

      const returnedTicketRegisAddr = await Ticket.create({
        companyId: company.id,
        assigneeId: user.id,
        category: TicketCategory.accounting,
        type: TicketType.registrationAddressChange,
        status: TicketStatus.open,
      });

      mockTicketsService.createRegisAddrChangeTicket.mockResolvedValue(
        returnedTicketRegisAddr,
      );

      const ticket = await controller.create({
        companyId: company.id,
        type: TicketType.registrationAddressChange,
      });

      expect(ticket.category).toBe(TicketCategory.accounting);
      expect(ticket.assigneeId).toBe(user.id);
      expect(ticket.companyId).toBe(company.id);
      expect(ticket.type).toBe(TicketType.registrationAddressChange);
      expect(ticket.status).toBe(TicketStatus.open);
    });

    it('if the service throw an error, throw', async () => {
      const company = await Company.create({ name: 'test' });
      const error = new ConflictException(
        `Cannot find user with role accountant to create a ticket`,
      );

      mockTicketsService.createManagementReportTicket.mockRejectedValue(error);

      await expect(
        controller.create({
          companyId: company.id,
          type: TicketType.managementReport,
        }),
      ).rejects.toEqual(error);
    });
    // });
  });
});
