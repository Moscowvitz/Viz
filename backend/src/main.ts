import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import * as path from "path";
import * as fs from "fs";
import * as express from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type, Accept, Authorization",
    credentials: true,
  });

  // Diagnostic Middleware
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      const auth = req.headers.authorization;
      if (auth?.startsWith("Bearer ")) {
        const token = auth.split(" ")[1];
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            const header = JSON.parse(
              Buffer.from(parts[0], "base64").toString(),
            );
            const payload = JSON.parse(
              Buffer.from(parts[1], "base64").toString(),
            );
          }
        } catch (e) {}
      }
    }
    next();
  });

  // Global prefix for all routes
  app.setGlobalPrefix("api");

  // Mount frontend static assets and SPA fallback
  const expressApp = app.getHttpAdapter().getInstance();
  const candidates = [
    path.resolve(__dirname, "../../frontend/dist"),
    path.resolve(process.cwd(), "frontend/dist"),
    path.resolve(process.cwd(), "../frontend/dist"),
  ];
  const frontendDist = candidates.find((p) => fs.existsSync(p)) || candidates[0];
  console.log(`[StoryEngine] Serving static frontend from: ${frontendDist} (exists: ${fs.existsSync(frontendDist)})`);

  expressApp.use(express.static(frontendDist));
  expressApp.use((req: any, res: any, next: any) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    const indexPath = path.join(frontendDist, "index.html");
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });

  const port = 3000;
  await app.listen(port, "0.0.0.0");
  console.log(`[StoryEngine] Server successfully running on http://0.0.0.0:${port}`);
}

bootstrap();
