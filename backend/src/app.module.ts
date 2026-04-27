import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { AppConfigModule } from "./config/config.module";
import { CategoriesModule } from "./categories/categories.module";
import { ProductsModule } from "./products/products.module";
import { CartsModule } from "./carts/carts.module";
import { OrdersModule } from "./orders/orders.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: "mysql",
        host: configService.get("DB_HOST", "localhost"),
        port: Number(configService.get("DB_PORT", 3306)),
        username: configService.get("DB_USERNAME", "root"),
        password: configService.get("DB_PASSWORD", "password"),
        database: configService.get("DB_NAME", "locotoons_dev"),
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
        synchronize: true,
      }),
    }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    CartsModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
