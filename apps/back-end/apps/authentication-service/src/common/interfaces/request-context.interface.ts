// src/common/interfaces/request-context.interface.ts
import { Request, Response } from 'express';
import { User } from '@modules/users/entities/user.entity';

export interface RequestContext {
  req: Request & {
    user?: User;
    sessionId?: string;
  };
  res: Response;
}
