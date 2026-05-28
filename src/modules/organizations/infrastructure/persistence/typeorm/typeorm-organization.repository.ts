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

  async save(organization: Organization): Promise<void> {
    await this.organizations.save(OrganizationMapper.toOrm(organization));
  }

  async listAll(): Promise<OrganizationContract[]> {
    const organizations = await this.organizations.find({
      order: { name: 'ASC' },
    });

    return organizations
      .map(OrganizationMapper.toDomain)
      .map(OrganizationMapper.toContract);
  }

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

  async addMember(input: {
    organizationId: OrganizationId;
    userId: string;
    role: string;
  }): Promise<void> {
    await this.users.manager.query(
      `
        INSERT INTO memberships (id, organization_id, user_id, role, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, now(), now())
        ON CONFLICT (organization_id, user_id)
        DO UPDATE SET role = EXCLUDED.role, updated_at = now()
      `,
      [input.organizationId.toString(), input.userId, input.role],
    );
  }

  async updateMemberRole(input: {
    organizationId: OrganizationId;
    userId: string;
    role: string;
  }): Promise<void> {
    await this.users.manager.query(
      `
        UPDATE memberships
        SET role = $3, updated_at = now()
        WHERE organization_id = $1
          AND user_id = $2
      `,
      [input.organizationId.toString(), input.userId, input.role],
    );
  }

  async getMemberRole(input: {
    organizationId: OrganizationId;
    userId: string;
  }): Promise<string | null> {
    const rows = await this.users.manager.query<Array<{ role: string }>>(
      `
        SELECT role
        FROM memberships
        WHERE organization_id = $1
          AND user_id = $2
        LIMIT 1
      `,
      [input.organizationId.toString(), input.userId],
    );

    return rows[0]?.role ?? null;
  }
}
