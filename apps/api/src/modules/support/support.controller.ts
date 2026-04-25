import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@cipherfoods/shared';
import { MessageSender } from './entities/ticket-message.entity';
import {
  CreateTicketDto,
  ReplyTicketDto,
  CreateFaqDto,
  UpdateFaqDto,
} from './dto/support.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // --- Tickets (authenticated users) ---

  @Post('tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create support ticket' })
  createTicket(
    @Body() dto: CreateTicketDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.supportService.createTicket(userId, dto);
  }

  @Get('tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my tickets' })
  getMyTickets(
    @CurrentUser('sub') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.supportService.getUserTickets(userId, pagination);
  }

  @Get('tickets/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ticket details' })
  getTicket(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.supportService.getTicketById(id, userId);
  }

  @Post('tickets/:id/reply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reply to ticket' })
  replyToTicket(
    @Param('id') id: string,
    @Body() dto: ReplyTicketDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.supportService.replyToTicket(id, userId, MessageSender.CUSTOMER, dto);
  }

  // --- Admin ticket management ---

  @Get('admin/tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'All tickets (admin)' })
  @ApiQuery({ name: 'status', required: false })
  getAllTickets(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
  ) {
    return this.supportService.getAllTickets(pagination, status);
  }

  @Post('admin/tickets/:id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agent reply to ticket' })
  agentReply(
    @Param('id') id: string,
    @Body() dto: ReplyTicketDto,
    @CurrentUser('sub') agentId: string,
  ) {
    return this.supportService.replyToTicket(id, agentId, MessageSender.AGENT, dto);
  }

  @Put('admin/tickets/:id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolve ticket' })
  resolveTicket(@Param('id') id: string) {
    return this.supportService.resolveTicket(id);
  }

  @Put('admin/tickets/:id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Close ticket' })
  closeTicket(@Param('id') id: string) {
    return this.supportService.closeTicket(id);
  }

  // --- FAQ (public read, admin write) ---

  @Get('faq')
  @ApiOperation({ summary: 'List FAQ entries' })
  @ApiQuery({ name: 'category', required: false })
  listFaq(@Query('category') category?: string) {
    return this.supportService.listFaq(category);
  }

  @Post('faq')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create FAQ entry (admin)' })
  createFaq(@Body() dto: CreateFaqDto) {
    return this.supportService.createFaq(dto);
  }

  @Put('faq/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update FAQ entry (admin)' })
  updateFaq(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.supportService.updateFaq(id, dto);
  }

  @Delete('faq/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete FAQ entry (admin)' })
  deleteFaq(@Param('id') id: string) {
    return this.supportService.deleteFaq(id);
  }
}
