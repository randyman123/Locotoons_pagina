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
import { PaymentsModule } from "./payments/payments.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const dbPort =
          configService.get("DB_PORT") || configService.get("MYSQLPORT") || 3306;

        console.log("Database env check", {
          DB_HOST: configService.get("DB_HOST"),
          DB_PORT: configService.get("DB_PORT"),
          MYSQLHOST: configService.get("MYSQLHOST"),
          MYSQLPORT: configService.get("MYSQLPORT"),
        });

        return {
          type: "mysql",
          host:
            configService.get("DB_HOST") ||
            configService.get("MYSQLHOST") ||
            "localhost",
          port: Number(dbPort),
          username:
            configService.get("DB_USERNAME") ||
            configService.get("MYSQLUSER") ||
            "root",
          password:
            configService.get("DB_PASSWORD") ||
            configService.get("MYSQLPASSWORD") ||
            "password",
          database:
            configService.get("DB_NAME") ||
            configService.get("MYSQLDATABASE") ||
            "locotoons_dev",
          entities: [__dirname + "/**/*.entity{.ts,.js}"],
          synchronize: true,
        };
      },
    }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    CartsModule,
    OrdersModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
