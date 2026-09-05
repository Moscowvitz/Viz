import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { passportJwtSecret } from "jwks-rsa";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const rawUrl = configService.get<string>("SUPABASE_URL");
    const supabaseUrl = rawUrl && !rawUrl.includes("your_supabase_") && rawUrl.startsWith("http") ? rawUrl : null;
    const secret = configService.get<string>("JWT_SECRET") || "story-engine-dev-secret-123456";

    super(
      supabaseUrl
        ? {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKeyProvider: passportJwtSecret({
              cache: true,
              rateLimit: true,
              jwksRequestsPerMinute: 5,
              jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
            }),
            algorithms: ["ES256"],
            audience: "authenticated",
            issuer: `${supabaseUrl}/auth/v1`,
          }
        : {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: true,
            secretOrKey: secret,
          },
    );
  }

  async validate(payload: any) {
    if (!payload.sub) {
      throw new UnauthorizedException("Invalid token payload: missing sub");
    }
    return { sub: payload.sub, email: payload.email };
  }
}
