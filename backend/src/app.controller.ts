import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Controller()
export class AppController {
  constructor(private configService: ConfigService) {}

  @Get("health")
  getHealth() {
    const supabaseUrl =
      this.configService.get<string>("SUPABASE_URL") || process.env.SUPABASE_URL;
    const supabaseKey =
      this.configService.get<string>("SUPABASE_SERVICE_ROLE_KEY") ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    const isRealSupabase = Boolean(
      supabaseUrl &&
      supabaseKey &&
      !supabaseUrl.includes("your_supabase_") &&
      supabaseUrl.startsWith("http")
    );

    const hasGeminiKey = Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.length > 10 &&
      !process.env.GEMINI_API_KEY.includes("your_")
    );

    return {
      status: "ok",
      database: isRealSupabase ? "real_supabase" : "in_memory_mock",
      supabaseUrl: isRealSupabase ? supabaseUrl : null,
      geminiConfigured: hasGeminiKey,
      timestamp: new Date().toISOString(),
    };
  }
}
