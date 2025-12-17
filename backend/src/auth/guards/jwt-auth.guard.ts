import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 * Protects routes that require authentication
 * Usage: @UseGuards(JwtAuthGuard)
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    /**
     * Override canActivate to add custom logic if needed
     */
    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }
}
