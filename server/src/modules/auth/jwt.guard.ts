import {
  CanActivate, ExecutionContext, Injectable, UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';

/**
 * Reads the Authorization: Bearer <token> header, verifies the JWT, and
 * attaches the resolved user to `req.user`.
 */
@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request & { user?: any }>();
    const auth = req.headers['authorization'];

    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('MISSING_TOKEN');
    }

    const token = auth.slice(7).trim();
    const user = await this.auth.verifyToken(token);
    if (!user) throw new UnauthorizedException('INVALID_TOKEN');

    (req as any).user = user;
    return true;
  }
}