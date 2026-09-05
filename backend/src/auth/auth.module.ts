import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./jwt.strategy";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>("JWT_SECRET") ||
          configService.get<string>("SUPABASE_JWT_SECRET"),
        signOptions: { expiresIn: "7d" },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService],
  exports: [PassportModule, JwtModule, AuthService],
})
export class AuthModule {}
