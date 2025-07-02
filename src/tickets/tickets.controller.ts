import { Body, ConflictException, Controller, Get, Post } from '@nestjs/common';
import { Company } from '../../db/models/Company';
import {
  Ticket,
  TicketCategory,
  TicketStatus,
  TicketType,
} from '../../db/models/Ticket';
import { User, UserRole } from '../../db/models/User';

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
  @Get()
  async findAll() {
    return await Ticket.findAll({ include: [Company, User] });
  }

  @Post()
  async create(@Body() newTicketDto: newTicketDto) {
    const { type, companyId } = newTicketDto;

    let category: TicketCategory;
    switch (type) {
      case TicketType.managementReport:
        category = TicketCategory.accounting;
        break;
      case TicketType.strikeOff:
        category = TicketCategory.management;
        break;
      default:
        category = TicketCategory.corporate;
        break;
    }

    let validRole: Array<UserRole>;
    switch (type) {
      case TicketType.managementReport:
        validRole = [UserRole.accountant];
        break;
      case TicketType.strikeOff:
        validRole = [UserRole.director];
        break;
      default:
        validRole = [UserRole.corporateSecretary, UserRole.director];
        break;
    }

    const assignees = await User.findAll({
      where: { companyId, role: validRole },
      order: [['createdAt', 'DESC']],
    });

    if (!assignees.length) {
      const userRoleStr = validRole.join(' or ');
      throw new ConflictException(
        `Cannot find user with role ${userRoleStr} to create a ticket`,
      );
    }

    let assignee = assignees[0];
    if (type === TicketType.registrationAddressChange) {
      const userCorporateSecretary = assignees.filter(
        (assignee) => assignee.role === UserRole.corporateSecretary,
      );

      if (userCorporateSecretary.length > 1)
        throw new ConflictException(
          `Multiple users with role ${UserRole.corporateSecretary}. Cannot create a ticket`,
        );

      const userDirector = assignees.filter(
        (assignee) => assignee.role === UserRole.director,
      );

      if (!userCorporateSecretary.length && userDirector.length > 1)
        throw new ConflictException(
          `Multiple users with role ${UserRole.director}. Cannot create a ticket`,
        );

      assignee = userCorporateSecretary.length
        ? userCorporateSecretary[0]
        : userDirector[0];
    } else if (type === TicketType.strikeOff && assignees.length > 1)
      throw new ConflictException(
        `Multiple users with role ${UserRole.director}. Cannot create a ticket`,
      );

    const ticket = await Ticket.create({
      companyId,
      assigneeId: assignee.id,
      category,
      type,
      status: TicketStatus.open,
    });

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
