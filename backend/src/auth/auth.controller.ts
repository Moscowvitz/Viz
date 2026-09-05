import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  @HttpCode(HttpStatus.OK)
  async signup(
    @Body() body: { email: string; password: string; fullName?: string },
  ) {
    return this.authService.signup(body);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body);
  }
}
