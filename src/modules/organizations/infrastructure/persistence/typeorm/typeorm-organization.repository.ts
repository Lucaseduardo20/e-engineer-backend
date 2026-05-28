import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationId } from '../../../../../shared/domain/value-objects/organization-id';
import { UniqueEntityId } from '../../../../../shared/domain/value-objects/unique-entity-id';
import type {
  Organization as OrganizationContract,
  User,
} from '../../../../../shared/contracts/dashboard.contracts';
import { UserOrmEntity } from '../../../../identity/infrastructure/persistence/typeorm/user.orm-entity';
import { Organization } from '../../../domain/entities/organization';
import { OrganizationMember } from '../../../domain/entities/organization-member';
import { OrganizationRepository } from '../../../domain/repositories/organization.repository';
import { OrganizationRole } from '../../../domain/value-objects/organization-role';
import { OrganizationMapper } from '../../mappers/organization.mapper';
import { OrganizationOrmEntity } from './organization.orm-entity';

type OrganizationMemberRow = {
  membership_id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  is_platform_admin: boolean;
  role: string | null;
};

@Injectable()
export class TypeOrmOrganizationRepository implements OrganizationRepository {
  constructor(
    @InjectRepository(OrganizationOrmEntity)
    private readonly organizations: Repository<OrganizationOrmEntity>,
    @InjectRepository(UserOrmEntity)
    private readonly users: Repository<UserOrmEntity>,
  ) {}

  async findById(organizationId: OrganizationId): Promise<Organization | null> {
    const organization = await this.organizations.findOne({
      where: { id: organizationId.toString() },
    });

    return organization ? OrganizationMapper.toDomain(organization) : null;
  }

  async getById(
    organizationId: OrganizationId,
  ): Promise<OrganizationContract | null> {
    const organization = await this.findById(organizationId);

    return organization ? OrganizationMapper.toContract(organization) : null;
  }

  async listMembers(
    organizationId: OrganizationId,
  ): Promise<OrganizationMember[]> {
    const rows = await this.users.manager.query<OrganizationMemberRow[]>(
      `
        SELECT
          m.id AS membership_id,
          u.id AS user_id,
          u.name AS full_name,
          u.email AS email,
          u.avatar_url AS avatar_url,
          u.is_platform_admin AS is_platform_admin,
          m.role AS role
        FROM users u
        LEFT JOIN memberships m
          ON m.user_id = u.id
         AND m.organization_id = u.organization_id
        WHERE u.organization_id = $1
        ORDER BY u.name ASC
      `,
      [organizationId.toString()],
    );

    return rows.map((row) =>
      OrganizationMember.restore(
        {
          organizationId,
          userId: new UniqueEntityId(row.user_id),
          fullName: row.full_name,
          email: row.email,
          avatarUrl: row.avatar_url,
          isPlatformAdmin: row.is_platform_admin,
          role: OrganizationRole.create(row.role ?? 'member'),
        },
        new UniqueEntityId(row.membership_id ?? row.user_id),
      ),
    );
  }

  async listUsers(organizationId: OrganizationId): Promise<User[]> {
    const members = await this.listMembers(organizationId);

    return members.map((member) => ({
      id: member.userId.toString(),
      fullName: member.fullName,
      email: member.email,
      avatarUrl: member.avatarUrl,
      roles: [member.role.value],
      isPlatformAdmin: member.isPlatformAdmin,
      organizationId: member.organizationId.toString(),
    }));
  }
}
