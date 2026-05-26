import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewQueryService } from './infrastructure/repositories/review-query.service';
import { ReviewOrmEntity } from './infrastructure/persistence/typeorm/review.orm-entity';
import { ReviewsController } from './presentation/controllers/reviews.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ReviewOrmEntity])],
  controllers: [ReviewsController],
  providers: [ReviewQueryService],
})
export class ReviewsModule {}
