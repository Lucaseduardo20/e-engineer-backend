import { Inject, Injectable } from '@nestjs/common';
import {
  DOMAIN_EVENT_PUBLISHER,
  type DomainEventPublisher,
} from '../../../../shared/application/ports/domain-event-publisher';
import { Result } from '../../../../shared/application/result/result';
import { OrganizationId } from '../../../../shared/domain/value-objects/organization-id';
import { User } from '../../domain/entities/user';
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../domain/repositories/user.repository';
import { CreateUserInputDto } from '../dto/create-user-input.dto';
import { CreateUserOutputDto } from '../dto/create-user-output.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly domainEventPublisher: DomainEventPublisher,
  ) {}

  async execute(
    input: CreateUserInputDto,
  ): Promise<Result<CreateUserOutputDto, Error>> {
    try {
      const existingUser = await this.userRepository.findByEmail(input.email);

      if (existingUser) {
        return Result.fail(new UserAlreadyExistsError(input.email));
      }

      const user = User.create({
        organizationId: OrganizationId.create(input.organizationId),
        email: input.email,
        password: input.password,
        name: input.name,
      });

      await this.userRepository.save(user);
      await this.domainEventPublisher.publishAll(user.pullDomainEvents());

      return Result.ok({
        id: user.id,
        organizationId: user.organizationId.toString(),
        email: user.email.toString(),
        name: user.name,
      });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
