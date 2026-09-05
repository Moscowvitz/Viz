import { Injectable, UnauthorizedException, Optional, Inject } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { SUPABASE_CLIENT } from "../database/database.module";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(
    @Optional() private configService?: ConfigService,
    @Optional() @Inject(SUPABASE_CLIENT) private supabaseClient?: any,
  ) {
    super();
  }

  async canActivate(context: any): Promise<boolean> {
    const supabaseUrl = this.configService?.get<string>("SUPABASE_URL") || process.env.SUPABASE_URL;
    const supabaseKey = this.configService?.get<string>("SUPABASE_SERVICE_ROLE_KEY") || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasSupabase = Boolean(
      supabaseUrl &&
      supabaseKey &&
      !supabaseUrl.includes("your_supabase_") &&
      supabaseUrl.startsWith("http")
    );

    if (!hasSupabase) {
      const req = context.switchToHttp().getRequest();
      req.user = { sub: "demo-user-123", email: "creator@storyengine.ai" };
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers?.authorization;
    if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token && this.supabaseClient?.auth?.getUser) {
        try {
          const { data, error } = await this.supabaseClient.auth.getUser(token);
          if (!error && data?.user) {
            req.user = {
              sub: data.user.id,
              id: data.user.id,
              email: data.user.email,
              user_metadata: data.user.user_metadata,
            };
            return true;
          }
        } catch {
          // Fall through to passport-jwt verification
        }
      }
    }

    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
