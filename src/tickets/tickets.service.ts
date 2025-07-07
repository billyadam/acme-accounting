import { ConflictException, Injectable } from '@nestjs/common';
import {
  Ticket,
  TicketCategory,
  TicketStatus,
  TicketType,
} from '../../db/models/Ticket';
import { User, UserRole } from '../../db/models/User';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class TicketsService {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  async createManagementReportTicket(companyId: number) {
    const category = TicketCategory.accounting;
    const type = TicketType.managementReport;
    const validRole = UserRole.accountant;

    const assignee = await User.findOne({
      where: { companyId, role: validRole },
      order: [['createdAt', 'DESC']],
    });

    if (!assignee) {
      throw new ConflictException(
        `Cannot find user with role ${validRole} to create a ticket`,
      );
    }

    return await Ticket.create({
      companyId,
      assigneeId: assignee.id,
      category,
      type,
      status: TicketStatus.open,
    });
  }
  async createStrikeOffTicket(companyId: number) {
    const category = TicketCategory.management;
    const type = TicketType.strikeOff;
    const validRole = UserRole.director;

    const assignees = await User.findAll({
      where: { companyId, role: validRole },
      order: [['createdAt', 'DESC']],
      limit: 2,
    });

    if (!assignees.length) {
      throw new ConflictException(
        `Cannot find user with role ${validRole} to create a ticket`,
      );
    }

    const assignee = assignees[0];
    if (assignees.length > 1)
      throw new ConflictException(
        `Multiple users with role ${validRole}. Cannot create a ticket`,
      );

    const resTicket = await this.sequelize.transaction(async (t) => {
      void (await Ticket.update(
        {
          status: TicketStatus.resolved,
        },
        {
          where: { companyId, status: TicketStatus.open },
          transaction: t,
        },
      ));

      return await Ticket.create(
        {
          companyId,
          assigneeId: assignee.id,
          category,
          type,
          status: TicketStatus.open,
        },
        { transaction: t },
      );
    });

    return resTicket;
  }
  async createRegisAddrChangeTicket(companyId: number) {
    const category = TicketCategory.corporate;
    const type = TicketType.registrationAddressChange;
    const validRoles = [UserRole.corporateSecretary, UserRole.director];

    const prevRegisAddrTicket = await Ticket.findOne({
      where: {
        companyId,
        type: TicketType.registrationAddressChange,
        status: TicketStatus.open,
      },
    });

    if (prevRegisAddrTicket)
      throw new ConflictException(
        `Open ticket with type ${TicketType.registrationAddressChange} already existed for this company`,
      );

    const assignees = await User.findAll({
      where: { companyId, role: validRoles },
      order: [['createdAt', 'DESC']],
    });

    if (!assignees.length) {
      const userRoleStr = validRoles.join(' or ');
      throw new ConflictException(
        `Cannot find user with role ${userRoleStr} to create a ticket`,
      );
    }

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

    const assignee = userCorporateSecretary.length
      ? userCorporateSecretary[0]
      : userDirector[0];

    return await Ticket.create({
      companyId,
      assigneeId: assignee.id,
      category,
      type,
      status: TicketStatus.open,
    });
  }
}
