import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { User } from '../users/entities/user.entity';

function readEmailFromArgs() {
  const email = process.argv[2]?.trim().toLowerCase();
  return email || null;
}

async function bootstrap() {
  const email = readEmailFromArgs();

  if (!email) {
    // eslint-disable-next-line no-console
    console.error('Debes indicar un email. Ejemplo: npm run users:make-admin -- admin@locotoons.com');
    process.exitCode = 1;
    return;
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const usersRepository = app.get<Repository<User>>(getRepositoryToken(User));
    const user = await usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      // eslint-disable-next-line no-console
      console.error(`No existe un usuario con el email ${email}.`);
      process.exitCode = 1;
      return;
    }

    if (user.role === 'admin') {
      // eslint-disable-next-line no-console
      console.log(`El usuario ${email} ya tiene rol admin.`);
      return;
    }

    user.role = 'admin';
    await usersRepository.save(user);

    // eslint-disable-next-line no-console
    console.log(`Usuario ${email} actualizado correctamente a rol admin.`);
  } finally {
    await app.close();
  }
}

void bootstrap();
