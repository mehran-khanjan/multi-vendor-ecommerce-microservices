// src/modules/auth/dto/auth-response.dto.ts
import { ObjectType, Field } from '@nestjs/graphql';
import { User } from '@modules/users/entities/user.entity';

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field()
  expiresIn: number;

  @Field(() => User)
  user: User;
}

@ObjectType()
export class TwoFactorResponse {
  @Field()
  requiresTwoFactor: boolean;

  @Field({ nullable: true })
  tempToken?: string;
}

@ObjectType()
export class TwoFactorSetupResponse {
  @Field()
  secret: string;

  @Field()
  qrCodeUrl: string;

  @Field(() => [String])
  backupCodes: string[];
}

@ObjectType()
export class MessageResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;
}
