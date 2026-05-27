import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import dataSource from '../../shared/infrastructure/database/data-source';

type Query = (sql: string, params?: unknown[]) => Promise<unknown>;

const organizationId = '7b8e7f0a-1c0e-4f80-9e6a-0f0c16f6b001';

function uuidFromText(value: string): string {
  const hash = createHash('sha1').update(value).digest('hex');
  const uuid = [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `8${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join('-');

  return uuid;
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function deliverableTypeFromName(name: string): string {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalized.includes('arquitetonico')) return 'architectural_project';
  if (normalized.includes('estrutural')) return 'structural_project';
  if (normalized.includes('eletrico')) return 'electrical_project';
  if (normalized.includes('hidraulico')) return 'hydraulic_project';
  if (normalized.includes('drenagem')) return 'drainage_project';
  if (normalized.includes('pavimentacao') || normalized.includes('geometrico')) {
    return 'paving_project';
  }
  if (normalized.includes('paisagistico')) return 'landscaping_project';
  if (normalized.includes('iluminacao')) return 'lighting_project';
  if (normalized.includes('memorial')) return 'descriptive_memorial';
  if (normalized.includes('orcamento') || normalized.includes('orcamentaria')) {
    return 'budget';
  }
  if (normalized.includes('cronograma')) return 'schedule';
  if (normalized.includes('art') || normalized.includes('rrt')) return 'art_rrt';
  if (normalized.includes('fotografico')) return 'photographic_report';
  if (normalized.includes('levantamento') || normalized.includes('topografico')) {
    return 'technical_survey';
  }

  return 'technical_report';
}

async function seedUsers(query: Query): Promise<void> {
  const passwordHash = await bcrypt.hash('123123lucas', 10);
  const users = [
    {
      id: '6a8ef9d8-3c2d-4e6d-ae62-dbb9d87b1001',
      name: 'Lucas Eduardo',
      email: 'admin@engflow.local',
      role: 'owner',
    },
    {
      id: '6a8ef9d8-3c2d-4e6d-ae62-dbb9d87b1002',
      name: 'Leonardo',
      email: 'leonardo@engflow.local',
      role: 'admin',
    },
    {
      id: '6a8ef9d8-3c2d-4e6d-ae62-dbb9d87b1003',
      name: 'Rafael',
      email: 'rafael@engflow.local',
      role: 'member',
    },
  ];

  for (const user of users) {
    await query(
      `
        INSERT INTO users (
          id, organization_id, email, password, name, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, now(), now())
        ON CONFLICT (email) DO UPDATE SET
          organization_id = EXCLUDED.organization_id,
          password = EXCLUDED.password,
          name = EXCLUDED.name,
          updated_at = now()
      `,
      [user.id, organizationId, user.email, passwordHash, user.name],
    );

    await query(
      `
        INSERT INTO memberships (
          id, organization_id, user_id, role, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, now(), now())
        ON CONFLICT (organization_id, user_id) DO UPDATE SET
          role = EXCLUDED.role,
          updated_at = now()
      `,
      [
        uuidFromText(`membership:${user.id}`),
        organizationId,
        user.id,
        user.role,
      ],
    );
  }
}

async function seedOrganization(query: Query): Promise<void> {
  await query(
    `
      INSERT INTO organizations (id, name, legal_name, created_at, updated_at)
      VALUES ($1, $2, $3, now(), now())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        legal_name = EXCLUDED.legal_name,
        updated_at = now()
    `,
    [
      organizationId,
      'Engenharia Horizonte Ltda',
      'Engenharia Horizonte Projetos e Consultoria Ltda',
    ],
  );
}

const templates = [
  {
    id: uuidFromText('template:reforma-escolar'),
    name: 'Template de Reforma Escolar',
    projectType: 'reforma escolar',
    description: 'Padrao de entregaveis para reformas em unidades escolares.',
    deliverables: [
      'Levantamento tecnico',
      'Projeto arquitetonico',
      'Memorial descritivo',
      'Orcamento',
      'Cronograma fisico-financeiro',
      'ART/RRT',
      'Relatorio fotografico',
    ],
  },
  {
    id: uuidFromText('template:ubs'),
    name: 'Template de UBS',
    projectType: 'unidade de saude',
    description: 'Padrao de entregaveis para unidade basica de saude.',
    deliverables: [
      'Projeto arquitetonico',
      'Projeto estrutural',
      'Projeto eletrico',
      'Projeto hidraulico',
      'Memorial descritivo',
      'Orcamento',
      'Cronograma fisico-financeiro',
      'ART/RRT',
    ],
  },
  {
    id: uuidFromText('template:pavimentacao'),
    name: 'Template de Pavimentacao',
    projectType: 'pavimentacao',
    description: 'Padrao para projetos viarios com drenagem e orcamento.',
    deliverables: [
      'Levantamento topografico',
      'Projeto geometrico',
      'Projeto de drenagem',
      'Memorial descritivo',
      'Planilha orcamentaria',
      'Cronograma fisico-financeiro',
    ],
  },
  {
    id: uuidFromText('template:praca-publica'),
    name: 'Template de Praca Publica',
    projectType: 'urbanismo',
    description: 'Padrao para revitalizacao de pracas e areas publicas.',
    deliverables: [
      'Estudo preliminar',
      'Projeto urbanistico',
      'Projeto de iluminacao',
      'Projeto paisagistico',
      'Memorial descritivo',
      'Orcamento',
      'Relatorio fotografico',
    ],
  },
];

const projects = [
  {
    id: uuidFromText('project:escola-jardim-primavera'),
    templateId: templates[0].id,
    name: 'Reforma da Escola Municipal Jardim Primavera',
    projectType: 'reforma escolar',
    client: 'Prefeitura Municipal de Sao Paulo',
    status: 'in_progress',
    responsible: 'Lucas Eduardo',
    tags: ['escola', 'reforma', 'prefeitura', 'acessibilidade'],
  },
  {
    id: uuidFromText('project:ubs-vila-esperanca'),
    templateId: templates[1].id,
    name: 'Construcao da UBS Vila Esperanca',
    projectType: 'unidade de saude',
    client: 'Prefeitura Municipal de Sao Paulo',
    status: 'in_review',
    responsible: 'Leonardo',
    tags: ['saude', 'UBS', 'obra publica', 'fundacao'],
  },
  {
    id: uuidFromText('project:praca-central'),
    templateId: templates[3].id,
    name: 'Revitalizacao da Praca Central',
    projectType: 'urbanismo',
    client: 'Prefeitura Municipal de Santo Andre',
    status: 'planning',
    responsible: 'Rafael',
    tags: ['praca', 'urbanismo', 'paisagismo', 'iluminacao'],
  },
  {
    id: uuidFromText('project:rua-das-acacias'),
    templateId: templates[2].id,
    name: 'Projeto de Pavimentacao da Rua das Acacias',
    projectType: 'pavimentacao',
    client: 'Prefeitura Municipal de Sao Bernardo',
    status: 'waiting_approval',
    responsible: 'Leonardo',
    tags: ['pavimentacao', 'drenagem', 'via publica'],
  },
  {
    id: uuidFromText('project:drenagem-sao-lucas'),
    templateId: templates[2].id,
    name: 'Sistema de Drenagem do Bairro Sao Lucas',
    projectType: 'drenagem',
    client: 'Prefeitura Municipal de Maua',
    status: 'overdue',
    responsible: 'Lucas Eduardo',
    tags: ['drenagem', 'galeria', 'aguas pluviais'],
  },
];

async function seedTemplates(query: Query): Promise<void> {
  for (const template of templates) {
    await query(
      `
        INSERT INTO project_templates (
          id, organization_id, name, project_type, description, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, now(), now())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          project_type = EXCLUDED.project_type,
          description = EXCLUDED.description,
          updated_at = now()
      `,
      [
        template.id,
        organizationId,
        template.name,
        template.projectType,
        template.description,
      ],
    );

    for (const [index, name] of template.deliverables.entries()) {
      await query(
        `
          INSERT INTO template_deliverables (
            id, organization_id, template_id, name, order_index, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, now(), now())
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            order_index = EXCLUDED.order_index,
            updated_at = now()
        `,
        [
          uuidFromText(`template-deliverable:${template.id}:${name}`),
          organizationId,
          template.id,
          name,
          index + 1,
        ],
      );
    }
  }
}

  async function seedProjectsAndDeliverables(query: Query): Promise<void> {
    const statuses = [
      'todo',
      'in_progress',
      'done',
      'blocked',
    ];

  for (const project of projects) {
    await query(
      `
        INSERT INTO projects (
          id, organization_id, name, client, project_type, status,
          responsible_name, tags, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, now(), now())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          client = EXCLUDED.client,
          project_type = EXCLUDED.project_type,
          status = EXCLUDED.status,
          responsible_name = EXCLUDED.responsible_name,
          tags = EXCLUDED.tags,
          updated_at = now()
      `,
      [
        project.id,
        organizationId,
        project.name,
        project.client,
        project.projectType,
        project.status,
        project.responsible,
        JSON.stringify(project.tags),
      ],
    );

    const template = templates.find((item) => item.id === project.templateId);

    if (!template) {
      continue;
    }

    for (const [index, name] of template.deliverables.entries()) {
      const status = statuses[(index + project.name.length) % statuses.length];
      const deliverableId = uuidFromText(`deliverable:${project.id}:${name}`);

      await query(
        `
        INSERT INTO deliverables (
          id, organization_id, project_id, template_deliverable_id, name,
          description, status, type, responsible_name, assignees, due_date,
          created_at, updated_at
        )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, now(), now())
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            status = EXCLUDED.status,
            type = EXCLUDED.type,
            responsible_name = EXCLUDED.responsible_name,
            assignees = EXCLUDED.assignees,
            due_date = EXCLUDED.due_date,
            updated_at = now()
        `,
        [
          deliverableId,
          organizationId,
          project.id,
          uuidFromText(`template-deliverable:${template.id}:${name}`),
          name,
          `Entregavel tecnico de ${project.projectType} vinculado ao projeto ${project.name}.`,
          status,
          deliverableTypeFromName(name),
          index % 2 === 0 ? project.responsible : 'Leonardo',
          JSON.stringify([index % 2 === 0 ? project.responsible : 'Leonardo']),
          daysFromNow(index * 7 - 10),
        ],
      );
    }
  }
}

async function seedDocumentsAndReviews(query: Query): Promise<void> {
  const documents = [
    {
      project: projects[0],
      deliverableName: 'Projeto arquitetonico',
      title: 'Projeto arquitetonico',
      versions: [
        ['R00', false, 'superseded', 'Estudo inicial para compatibilizacao.'],
        ['R01', false, 'in_review', 'Ajustes de acessibilidade incluidos.'],
        ['R02', true, 'approved', 'Versao oficial para envio ao cliente.'],
      ],
    },
    {
      project: projects[0],
      deliverableName: 'Memorial descritivo',
      title: 'Memorial descritivo',
      versions: [['R00', true, 'approved', 'Memorial oficial da reforma.']],
    },
    {
      project: projects[1],
      deliverableName: 'Orcamento',
      title: 'Orcamento',
      versions: [
        ['R00', false, 'superseded', 'Planilha preliminar.'],
        ['R01', false, 'in_review', 'Em revisao de quantitativos.'],
      ],
    },
    {
      project: projects[3],
      deliverableName: 'Projeto de drenagem',
      title: 'Projeto de drenagem',
      versions: [['R00', false, 'in_review', 'Primeira emissao tecnica.']],
    },
  ] as const;

  for (const documentData of documents) {
    const deliverableId = uuidFromText(
      `deliverable:${documentData.project.id}:${documentData.deliverableName}`,
    );
    const documentId = uuidFromText(
      `document:${documentData.project.id}:${documentData.title}`,
    );

    await query(
      `
        INSERT INTO documents (
          id, organization_id, project_id, deliverable_id, title, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, now(), now())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          updated_at = now()
      `,
      [
        documentId,
        organizationId,
        documentData.project.id,
        deliverableId,
        documentData.title,
      ],
    );

    for (const [index, version] of documentData.versions.entries()) {
      const [revision, isOfficial, status, notes] = version;
      const versionId = uuidFromText(
        `document-version:${documentId}:${revision}`,
      );
      const fileName = `${slugify(documentData.title)}-${revision.toLowerCase()}.pdf`;

      await query(
        `
          INSERT INTO document_versions (
            id, organization_id, document_id, revision, file_name, file_path,
            uploaded_by, uploaded_at, is_official, status, notes, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())
          ON CONFLICT (id) DO UPDATE SET
            file_name = EXCLUDED.file_name,
            file_path = EXCLUDED.file_path,
            uploaded_by = EXCLUDED.uploaded_by,
            uploaded_at = EXCLUDED.uploaded_at,
            is_official = EXCLUDED.is_official,
            status = EXCLUDED.status,
            notes = EXCLUDED.notes,
            updated_at = now()
        `,
        [
          versionId,
          organizationId,
          documentId,
          revision,
          fileName,
          `/fake-storage/projects/${documentData.project.id}/${fileName}`,
          index % 2 === 0 ? 'Lucas Eduardo' : 'Leonardo',
          daysFromNow(index * 2 - 14),
          isOfficial,
          status,
          notes,
        ],
      );
    }
  }

  const reviews = [
    {
      id: 'arquitetonico-r01',
      project: projects[0],
      deliverable: 'Projeto arquitetonico',
      document: 'Projeto arquitetonico',
      revision: 'R01',
      status: 'pending',
      requestedBy: 'Leonardo',
      reviewedBy: null,
      dueInDays: 3,
      comment:
        'Compatibilizar projeto arquitetonico com o memorial descritivo.',
    },
    {
      id: 'orcamento-r01',
      project: projects[1],
      deliverable: 'Orcamento',
      document: 'Orcamento',
      revision: 'R01',
      status: 'rejected',
      requestedBy: 'Lucas Eduardo',
      reviewedBy: 'Rafael',
      dueInDays: -2,
      comment: 'Orcamento apresenta divergencia nos quantitativos de piso.',
    },
    {
      id: 'memorial-r00',
      project: projects[0],
      deliverable: 'Memorial descritivo',
      document: 'Memorial descritivo',
      revision: 'R00',
      status: 'approved',
      requestedBy: 'Leonardo',
      reviewedBy: 'Lucas Eduardo',
      dueInDays: -4,
      comment: 'Revisao aprovada para envio ao cliente.',
    },
    {
      id: 'drenagem-r00',
      project: projects[3],
      deliverable: 'Projeto de drenagem',
      document: 'Projeto de drenagem',
      revision: 'R00',
      status: 'overdue',
      requestedBy: 'Rafael',
      reviewedBy: null,
      dueInDays: -6,
      comment: 'Atualizar prancha conforme solicitacao da fiscalizacao.',
    },
  ];

  for (const review of reviews) {
    const deliverableId = uuidFromText(
      `deliverable:${review.project.id}:${review.deliverable}`,
    );
    const documentId = uuidFromText(
      `document:${review.project.id}:${review.document}`,
    );
    const versionId = uuidFromText(
      `document-version:${documentId}:${review.revision}`,
    );

    await query(
      `
        INSERT INTO reviews (
          id, organization_id, project_id, deliverable_id, document_version_id,
          status, requested_by, reviewed_by, due_date, comment, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          reviewed_by = EXCLUDED.reviewed_by,
          due_date = EXCLUDED.due_date,
          comment = EXCLUDED.comment,
          updated_at = now()
      `,
      [
        uuidFromText(`review:${review.id}`),
        organizationId,
        review.project.id,
        deliverableId,
        versionId,
        review.status,
        review.requestedBy,
        review.reviewedBy,
        daysFromNow(review.dueInDays),
        review.comment,
      ],
    );
  }
}

async function seedActivityLog(query: Query): Promise<void> {
  const activities = [
    [
      'Lucas Eduardo',
      'project.created',
      'project',
      projects[0].id,
      'Projeto criado',
    ],
    [
      'Lucas Eduardo',
      'template.applied',
      'project',
      projects[0].id,
      'Template aplicado',
    ],
    ['Leonardo', 'document.uploaded', 'document', null, 'Documento enviado'],
    [
      'Lucas Eduardo',
      'document.official',
      'document_version',
      null,
      'Nova versao marcada como oficial',
    ],
    ['Rafael', 'review.requested', 'review', null, 'Revisao solicitada'],
    ['Lucas Eduardo', 'review.approved', 'review', null, 'Revisao aprovada'],
    ['Rafael', 'review.rejected', 'review', null, 'Revisao reprovada'],
  ] as const;

  for (const [index, activity] of activities.entries()) {
    const [actorName, action, entityType, entityId, description] = activity;

    await query(
      `
        INSERT INTO activity_logs (
          id, organization_id, actor_name, action, entity_type, entity_id,
          description, metadata, occurred_at, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, now(), now())
        ON CONFLICT (id) DO UPDATE SET
          actor_name = EXCLUDED.actor_name,
          action = EXCLUDED.action,
          entity_type = EXCLUDED.entity_type,
          description = EXCLUDED.description,
          metadata = EXCLUDED.metadata,
          occurred_at = EXCLUDED.occurred_at,
          updated_at = now()
      `,
      [
        uuidFromText(`activity:${action}:${index}`),
        organizationId,
        actorName,
        action,
        entityType,
        entityId,
        description,
        JSON.stringify({ source: 'local-seed' }),
        daysFromNow(index - 7),
      ],
    );
  }
}

async function main(): Promise<void> {
  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      const query: Query = (sql, params) => manager.query(sql, params);

      await seedOrganization(query);
      await seedUsers(query);
      await seedTemplates(query);
      await seedProjectsAndDeliverables(query);
      await seedDocumentsAndReviews(query);
      await seedActivityLog(query);
    });

    console.log('Database seed completed.');
    console.log('Login: admin@engflow.local / 123123lucas');
  } finally {
    await dataSource.destroy();
  }
}

void main().catch((error: unknown) => {
  console.error('Database seed failed.');
  console.error(error);
  process.exit(1);
});
