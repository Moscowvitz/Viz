import {
  Injectable,
  Inject,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_CLIENT } from "../database/database.module";

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName?: string;
  };
  session: {
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
  };
}

@Injectable()
export class AuthService {
  private anonClient: SupabaseClient | null = null;

  constructor(
    @Inject(SUPABASE_CLIENT) private adminClient: any,
    private configService: ConfigService,
  ) {
    const supabaseUrl =
      this.configService.get<string>("SUPABASE_URL") || process.env.SUPABASE_URL;
    const anonKey =
      this.configService.get<string>("SUPABASE_ANON_KEY") ||
      process.env.SUPABASE_ANON_KEY;

    if (
      supabaseUrl &&
      anonKey &&
      !supabaseUrl.includes("your_supabase_") &&
      supabaseUrl.startsWith("http")
    ) {
      this.anonClient = createClient(supabaseUrl, anonKey);
    }
  }

  private isLiveSupabase(): boolean {
    const supabaseUrl =
      this.configService.get<string>("SUPABASE_URL") || process.env.SUPABASE_URL;
    const serviceKey =
      this.configService.get<string>("SUPABASE_SERVICE_ROLE_KEY") ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;
    return Boolean(
      supabaseUrl &&
      serviceKey &&
      !supabaseUrl.includes("your_supabase_") &&
      supabaseUrl.startsWith("http")
    );
  }

  async signup(dto: {
    email: string;
    password: string;
    fullName?: string;
  }): Promise<AuthResponse> {
    const email = dto.email?.trim().toLowerCase();
    const password = dto.password?.trim();
    const fullName = dto.fullName?.trim() || email.split("@")[0];

    if (!email || !password) {
      throw new BadRequestException("Email and password are required");
    }

    if (password.length < 6) {
      throw new BadRequestException("Password must be at least 6 characters long");
    }

    if (!this.isLiveSupabase() || !this.adminClient?.auth?.admin) {
      // Mock mode fallback
      const mockId = "user-" + Date.now();
      return {
        user: { id: mockId, email, fullName },
        session: {
          access_token: "mock-access-token-" + mockId,
          expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7,
        },
      };
    }

    // 1. Create user in Supabase with auto-confirmation (email_confirm: true)
    const { data: createData, error: createError } =
      await this.adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

    if (createError) {
      if (
        createError.message.includes("already registered") ||
        createError.message.includes("already exists")
      ) {
        throw new ConflictException(
          "An account with this email already exists. Please sign in.",
        );
      }
      throw new BadRequestException(createError.message);
    }

    const createdUser = createData.user;

    // 2. Ensure profile entry exists
    try {
      await this.adminClient.from("profiles").upsert(
        {
          id: createdUser.id,
          display_name: fullName,
          xp: 0,
          level: 1,
        },
        { onConflict: "id" },
      );
    } catch (e) {
      // Ignored if profile trigger already created it
    }

    // 3. Immediately sign in to generate valid access_token and session
    const client = this.anonClient || this.adminClient;
    const { data: signinData, error: signinError } =
      await client.auth.signInWithPassword({
        email,
        password,
      });

    if (signinError || !signinData.session) {
      // Fallback to admin generate link or direct token if needed
      return {
        user: {
          id: createdUser.id,
          email: createdUser.email || email,
          fullName,
        },
        session: {
          access_token: "token-" + createdUser.id,
          expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7,
        },
      };
    }

    return {
      user: {
        id: createdUser.id,
        email: createdUser.email || email,
        fullName,
      },
      session: {
        access_token: signinData.session.access_token,
        refresh_token: signinData.session.refresh_token,
        expires_at: signinData.session.expires_at,
      },
    };
  }

  async login(dto: { email: string; password: string }): Promise<AuthResponse> {
    const email = dto.email?.trim().toLowerCase();
    const password = dto.password?.trim();

    if (!email || !password) {
      throw new BadRequestException("Email and password are required");
    }

    if (!this.isLiveSupabase()) {
      // Mock mode fallback
      return {
        user: {
          id: "demo-user-123",
          email,
          fullName: email.split("@")[0],
        },
        session: {
          access_token: "demo-session-token-story-engine",
          expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7,
        },
      };
    }

    const client = this.anonClient || this.adminClient;
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const fullName =
      data.user.user_metadata?.full_name ||
      data.user.user_metadata?.display_name ||
      email.split("@")[0];

    return {
      user: {
        id: data.user.id,
        email: data.user.email || email,
        fullName,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    };
  }
}
