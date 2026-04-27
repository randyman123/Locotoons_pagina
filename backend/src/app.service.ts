import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getStatus() {
    return {
      status: "Locotoons API running",
      timestamp: new Date().toISOString(),
    };
  }
}
