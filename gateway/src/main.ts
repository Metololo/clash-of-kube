// src/main.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('⚔️ Clash-of-Kube: Battle Gateway')
    .setDescription(
      `The central command and control API for pod-based warfare.
      
      ### Workflow:
      1. **Setup**: Deploys the Red and Blue team microservices into the Kubernetes cluster.
      2. **Monitor**: Wait for pod replicas to reach 'Running' state.
      3. **Start**: Broadcasts the combat signal to trigger internal game logic.
      
      *Built with NestJS, Redis, and Go Game-Master.*`,
    )
    .setVersion('1.0')
    .addTag('Battle Operations', 'Orchestrate K8s deployments and game state')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Clash-of-Kube API Docs',
  });

  await app.listen(3000);
}
bootstrap();
