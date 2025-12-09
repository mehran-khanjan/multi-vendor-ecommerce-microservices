// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthUser } from '@common/interfaces';

export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthUser | undefined,
    context: ExecutionContext,
  ): AuthUser | any => {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const user = req.context?.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
