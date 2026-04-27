import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";

@ApiTags("app")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: "Health check basico del backend" })
  @ApiOkResponse({ description: "Estado general de la API" })
  getStatus() {
    return this.appService.getStatus();
  }
}
