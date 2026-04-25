import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { TicketMessage, MessageSender } from './entities/ticket-message.entity';
import { FaqEntry } from './entities/faq-entry.entity';
import { CreateTicketDto, ReplyTicketDto, CreateFaqDto, UpdateFaqDto } from './dto/support.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(TicketMessage)
    private readonly messageRepo: Repository<TicketMessage>,
    @InjectRepository(FaqEntry)
    private readonly faqRepo: Repository<FaqEntry>,
  ) {}

  async createTicket(userId: string, dto: CreateTicketDto): Promise<Ticket> {
    const ticketNumber = `TK${Date.now().toString(36).toUpperCase()}`;

    const ticket = this.ticketRepo.create({
      ticketNumber,
      userId,
      subject: dto.subject,
      category: dto.category,
      priority: dto.priority,
      orderId: dto.orderId,
    });

    const saved = await this.ticketRepo.save(ticket);

    // Add first message
    const message = this.messageRepo.create({
      ticketId: saved.id,
      senderId: userId,
      senderType: MessageSender.CUSTOMER,
      message: dto.message,
    });
    await this.messageRepo.save(message);

    this.logger.log(`Ticket created: ${ticketNumber}`);
    return this.getTicketById(saved.id, userId);
  }

  async getTicketById(ticketId: string, userId?: string): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (userId && ticket.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return ticket;
  }

  async getUserTickets(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<Ticket>> {
    const [items, total] = await this.ticketRepo.findAndCount({
      where: { userId },
      order: { updatedAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });
    return new PaginatedResult(items, total, pagination.page, pagination.limit);
  }

  async getAllTickets(
    pagination: PaginationDto,
    status?: string,
  ): Promise<PaginatedResult<Ticket>> {
    const qb = this.ticketRepo.createQueryBuilder('ticket');

    if (status) {
      qb.where('ticket.status = :status', { status });
    }

    qb.orderBy('ticket.updatedAt', 'DESC');

    const [items, total] = await qb
      .skip(pagination.skip)
      .take(pagination.limit)
      .getManyAndCount();

    return new PaginatedResult(items, total, pagination.page, pagination.limit);
  }

  async replyToTicket(
    ticketId: string,
    senderId: string,
    senderType: MessageSender,
    dto: ReplyTicketDto,
  ): Promise<TicketMessage> {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (senderType === MessageSender.CUSTOMER && ticket.userId !== senderId) {
      throw new ForbiddenException('Access denied');
    }

    const message = this.messageRepo.create({
      ticketId,
      senderId,
      senderType,
      message: dto.message,
    });

    const saved = await this.messageRepo.save(message);

    // Update ticket status based on who replied
    if (senderType === MessageSender.AGENT) {
      ticket.status = TicketStatus.WAITING_CUSTOMER;
      if (!ticket.assignedTo) ticket.assignedTo = senderId;
    } else {
      ticket.status = TicketStatus.IN_PROGRESS;
    }
    await this.ticketRepo.save(ticket);

    return saved;
  }

  async resolveTicket(ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    ticket.status = TicketStatus.RESOLVED;
    ticket.resolvedAt = new Date();
    return this.ticketRepo.save(ticket);
  }

  async closeTicket(ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    ticket.status = TicketStatus.CLOSED;
    if (!ticket.resolvedAt) ticket.resolvedAt = new Date();
    return this.ticketRepo.save(ticket);
  }

  // --- FAQ ---

  async listFaq(category?: string): Promise<FaqEntry[]> {
    const qb = this.faqRepo
      .createQueryBuilder('faq')
      .where('faq.isActive = true');

    if (category) {
      qb.andWhere('faq.category = :category', { category });
    }

    return qb.orderBy('faq.sortOrder', 'ASC').getMany();
  }

  async createFaq(dto: CreateFaqDto): Promise<FaqEntry> {
    const faq = this.faqRepo.create(dto);
    return this.faqRepo.save(faq);
  }

  async updateFaq(id: string, dto: UpdateFaqDto): Promise<FaqEntry> {
    const faq = await this.faqRepo.findOne({ where: { id } });
    if (!faq) throw new NotFoundException('FAQ entry not found');

    Object.assign(faq, dto);
    return this.faqRepo.save(faq);
  }

  async deleteFaq(id: string): Promise<void> {
    const result = await this.faqRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('FAQ entry not found');
    }
  }
}
