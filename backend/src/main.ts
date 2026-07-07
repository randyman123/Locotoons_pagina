import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { TEMPLATE_SWAGGER } from "./template/template.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle(TEMPLATE_SWAGGER.title)
    .setDescription(TEMPLATE_SWAGGER.description)
    .setVersion(TEMPLATE_SWAGGER.version)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || process.env.APP_PORT || 3001;
  await app.listen(port);
}

bootstrap();
