// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserContext } from '@common/interfaces';

export const CurrentUser = createParamDecorator(
  (
    data: keyof UserContext | undefined,
    context: ExecutionContext,
  ): UserContext | any => {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const user = req.context?.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
