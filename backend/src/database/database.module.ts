import { Module, Global, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "@supabase/supabase-js";
import { getMockSupabaseClient } from "./mock-supabase";

export const SUPABASE_CLIENT = "SUPABASE_CLIENT";

@Global()
@Module({
  providers: [
    {
      provide: SUPABASE_CLIENT,
      useFactory: (configService: ConfigService): any => {
        const supabaseUrl = configService.get<string>("SUPABASE_URL");
        const supabaseKey = configService.get<string>(
          "SUPABASE_SERVICE_ROLE_KEY",
        );

        const isValid = Boolean(
          supabaseUrl &&
          supabaseKey &&
          !supabaseUrl.includes("your_supabase_") &&
          supabaseUrl.startsWith("http")
        );

        if (!isValid) {
          Logger.warn(
            "[AI Studio] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured or placeholder. Using active in-memory database mock.",
            "DatabaseModule"
          );
          return getMockSupabaseClient();
        }

        try {
          return createClient(supabaseUrl, supabaseKey);
        } catch (err) {
          Logger.warn(
            "[AI Studio] Failed to initialize Supabase client. Falling back to in-memory database mock.",
            "DatabaseModule"
          );
          return getMockSupabaseClient();
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [SUPABASE_CLIENT],
})
export class DatabaseModule {}
