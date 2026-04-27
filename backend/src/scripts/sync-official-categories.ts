import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CategoriesService } from '../categories/categories.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const categoriesService = app.get(CategoriesService);
    const result = await categoriesService.syncOfficialCategories();
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

void bootstrap();
