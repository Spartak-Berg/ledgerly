import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { readEnvironment } from './config/environment';

async function bootstrap() {
  const environment = readEnvironment();
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  app.enableCors({
    origin: environment.webOrigin,
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ledgerly API')
    .setDescription('REST API for the Ledgerly financial workspace')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, { useGlobalPrefix: false });

  await app.listen(environment.port);
}
void bootstrap();
