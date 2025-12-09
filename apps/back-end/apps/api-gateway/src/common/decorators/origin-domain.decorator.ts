// src/common/decorators/origin-domain.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { OriginDomain } from '@common/enums';

export const RequestOrigin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): OriginDomain => {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    return req.context?.originDomain || OriginDomain.UNKNOWN;
  },
);
