import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditModule } from './modules/audit/audit.module';
import { DeliverablesModule } from './modules/deliverables/deliverables.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { IdentityModule } from './modules/identity/identity.module';
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { validateEnv } from './shared/infrastructure/config/env.validation';
import { createTypeOrmOptions } from './shared/infrastructure/database/typeorm.config';
import { SharedInfrastructureModule } from './shared/infrastructure/shared-infrastructure.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createTypeOrmOptions,
    }),
    SharedInfrastructureModule,
    IdentityModule,
    OrganizationsModule,
    ProjectsModule,
    TemplatesModule,
    DeliverablesModule,
    DocumentsModule,
    ReviewsModule,
    KnowledgeBaseModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
