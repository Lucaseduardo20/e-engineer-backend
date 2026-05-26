import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  Organization,
  User,
} from '../../../../shared/contracts/dashboard.contracts';
import { UserOrmEntity } from '../../../identity/infrastructure/persistence/typeorm/user.orm-entity';
import { OrganizationOrmEntity } from '../persistence/typeorm/organization.orm-entity';

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Injectable()
export class OrganizationQueryService {
  constructor(
    @InjectRepository(OrganizationOrmEntity)
    private readonly organizations: Repository<OrganizationOrmEntity>,
    @InjectRepository(UserOrmEntity)
    private readonly users: Repository<UserOrmEntity>,
  ) {}

  async getById(id: string): Promise<Organization | null> {
    const organization = await this.organizations.findOne({ where: { id } });

    return organization ? this.toContract(organization) : null;
  }

  async listUsers(organizationId: string): Promise<User[]> {
    const users = await this.users.find({
      where: { organizationId },
      order: { name: 'ASC' },
    });

    return users.map((user) => ({
      id: user.id,
      fullName: user.name,
      email: user.email,
      avatarUrl: null,
      roles: [],
      organizationId: user.organizationId,
    }));
  }

  private toContract(organization: OrganizationOrmEntity): Organization {
    return {
      id: organization.id,
      name: organization.name,
      slug: slugify(organization.name),
      parentId: null,
    };
  }
}
