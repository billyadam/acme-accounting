import { Body, ConflictException, Controller, Get, Post } from '@nestjs/common';
import { Company } from '../../db/models/Company';
import {
  Ticket,
  TicketCategory,
  TicketStatus,
  TicketType,
} from '../../db/models/Ticket';
import { User } from '../../db/models/User';
import { TicketsService } from './tickets.service';

interface newTicketDto {
  type: TicketType;
  companyId: number;
}

interface TicketDto {
  id: number;
  type: TicketType;
  companyId: number;
  assigneeId: number;
  status: TicketStatus;
  category: TicketCategory;
}

@Controller('api/v1/tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Get()
  async findAll() {
    return await Ticket.findAll({ include: [Company, User] });
  }

  @Post()
  async create(@Body() newTicketDto: newTicketDto) {
    const { type, companyId } = newTicketDto;

    let ticket: Ticket;
    switch (type) {
      case TicketType.managementReport:
        ticket =
          await this.ticketsService.createManagementReportTicket(companyId);
        break;
      case TicketType.registrationAddressChange:
        ticket =
          await this.ticketsService.createRegisAddrChangeTicket(companyId);
        break;
      case TicketType.strikeOff:
        ticket = await this.ticketsService.createStrikeOffTicket(companyId);
        break;
      default:
        throw new ConflictException(`Ticket Type Unknown`);
    }

    const ticketDto: TicketDto = {
      id: ticket.id,
      type: ticket.type,
      assigneeId: ticket.assigneeId,
      status: ticket.status,
      category: ticket.category,
      companyId: ticket.companyId,
    };

    return ticketDto;
  }
}
