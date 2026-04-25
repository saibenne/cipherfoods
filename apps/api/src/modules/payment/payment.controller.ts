import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RefundDto } from './dto/refund.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole } from '@cipherfoods/shared';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-order')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('keycloak')
  @ApiOperation({ summary: 'Create a Razorpay order for payment' })
  @ApiResponse({ status: 201, description: 'Razorpay order created' })
  createOrder(@CurrentUser() user: JwtPayload, @Body() dto: CreatePaymentDto) {
    return this.paymentService.createRazorpayOrder(user.sub, dto);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('keycloak')
  @ApiOperation({ summary: 'Verify Razorpay payment after frontend callback' })
  @ApiResponse({ status: 200, description: 'Payment verified and captured' })
  verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.paymentService.verifyPayment(dto);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Razorpay webhook handler (no auth)' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(
    @Body() body: Record<string, unknown>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    await this.paymentService.handleWebhook(body, signature);
    return { status: 'ok' };
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('keycloak')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Initiate a refund (admin only)' })
  @ApiResponse({ status: 200, description: 'Refund initiated' })
  initiateRefund(@Body() dto: RefundDto) {
    return this.paymentService.initiateRefund(dto);
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('keycloak')
  @ApiOperation({ summary: 'Get payment details by order ID' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  getPaymentByOrderId(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentService.getPaymentByOrderId(orderId);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('keycloak')
  @ApiOperation({ summary: 'Get payment history for current user' })
  @ApiResponse({ status: 200, description: 'Paginated payment history' })
  getPaymentHistory(@CurrentUser() user: JwtPayload, @Query() pagination: PaginationDto) {
    return this.paymentService.getPaymentHistory(user.sub, pagination);
  }
}
