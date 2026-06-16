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

function normalizeTechnicalTagSlug(value: string): string {
  return value
    .trim()
    .replace(/\./g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
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
      isPlatformAdmin: true,
    },
    {
      id: '6a8ef9d8-3c2d-4e6d-ae62-dbb9d87b1002',
      name: 'Leonardo',
      email: 'leonardo@engflow.local',
      role: 'admin',
      isPlatformAdmin: false,
    },
    {
      id: '6a8ef9d8-3c2d-4e6d-ae62-dbb9d87b1003',
      name: 'Rafael',
      email: 'rafael@engflow.local',
      role: 'member',
      isPlatformAdmin: false,
    },
  ];

  for (const user of users) {
    await query(
      `
        INSERT INTO users (
          id, organization_id, email, password, name, is_platform_admin, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, now(), now())
        ON CONFLICT (email) DO UPDATE SET
          organization_id = EXCLUDED.organization_id,
          password = EXCLUDED.password,
          name = EXCLUDED.name,
          is_platform_admin = EXCLUDED.is_platform_admin,
          updated_at = now()
      `,
      [
        user.id,
        organizationId,
        user.email,
        passwordHash,
        user.name,
        user.isPlatformAdmin,
      ],
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
    status: 'completed',
    responsible: 'Lucas Eduardo',
    tags: ['escola', 'reforma', 'prefeitura', 'acessibilidade'],
  },
  {
    id: uuidFromText('project:ubs-vila-esperanca'),
    templateId: templates[1].id,
    name: 'Construcao da UBS Vila Esperanca',
    projectType: 'unidade de saude',
    client: 'Prefeitura Municipal de Sao Paulo',
    status: 'in_progress',
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
  const documentVersionIdsByKey = new Map<string, string>();

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
      title: 'Memorial Descritivo - Reforma Escolar',
      versions: [['R00', true, 'approved', 'Memorial oficial da reforma.']],
    },
    {
      project: projects[1],
      deliverableName: 'Orcamento',
      title: 'Planilha Orcamentaria - UBS Vila Esperanca',
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
  ];

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
      const revisionCode = String(revision);
      const versionId = uuidFromText(
        `document-version:${documentId}:${revisionCode}`,
      );
      const fileName = `${slugify(documentData.title)}-${revisionCode.toLowerCase()}.pdf`;

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
          revisionCode,
          fileName,
          `/fake-storage/projects/${documentData.project.id}/${fileName}`,
          index % 2 === 0 ? 'Lucas Eduardo' : 'Leonardo',
          daysFromNow(index * 2 - 14),
          isOfficial,
          status,
          notes,
        ],
      );

      const reviewLookupKey = [
        documentData.project.id,
        documentData.deliverableName,
        revisionCode,
      ].join('|');
      documentVersionIdsByKey.set(reviewLookupKey, versionId);
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
      document: 'Planilha Orcamentaria - UBS Vila Esperanca',
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
    const versionLookupKey = [
      review.project.id,
      review.deliverable,
      review.revision,
    ].join('|');
    const versionId = documentVersionIdsByKey.get(versionLookupKey);

    if (!versionId) {
      throw new Error(
        `Seed review "${review.id}" references missing document version (${versionLookupKey}).`,
      );
    }

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



type SeedKnowledgeItem = {
  key: string;
  title: string;
  description: string;
  type: string;
  status: string;
  tags: string[];
  content: Record<string, unknown>;
  publishedAt?: Date | null;
  archivedAt?: Date | null;
  deprecatedAt?: Date | null;
};

async function seedKnowledgeBase(query: Query): Promise<void> {
  const author = 'Lucas Eduardo';
  const reviewer = 'Leonardo';
  const now = new Date();

  const items: SeedKnowledgeItem[] = [
    {
      key: 'kb:technical-standard:nomenclatura-arquivos',
      title: 'Padrao de nomenclatura de arquivos tecnicos',
      description: 'Define o padrao de nomes para arquivos PDF, DWG e planilhas por disciplina e revisao.',
      type: 'technical_standard',
      status: 'published',
      tags: ['padrao-tecnico', 'nomenclatura', 'documentacao', 'prefeitura-sp'],
      content: {
        objective: 'Padronizar nomes para evitar versoes duplicadas e perda de rastreabilidade.',
        convention: 'DISCIPLINA_TIPO_PROJETO_CLIENTE_REVISAO_DATA',
        examples: ['ARQ_UBS_VILA_ESPERANCA_R02_2026-03-10', 'HID_REFORMA_ESCOLA_JP_R01_2026-02-20'],
      },
      publishedAt: now,
    },
    {
      key: 'kb:technical-standard:organizacao-disciplinas-ubs',
      title: 'Organizacao de disciplinas em projetos de UBS',
      description: 'Orienta a sequencia de compatibilizacao entre arquitetura, estrutural, eletrico e hidraulico.',
      type: 'technical_standard',
      status: 'published',
      tags: ['ubs', 'compatibilizacao', 'arquitetura', 'hidraulica'],
      content: {
        sequence: ['arquitetura', 'estrutural', 'hidraulica', 'eletrica'],
        qualityGate: 'Revisao cruzada obrigatoria antes da emissao oficial.',
      },
      publishedAt: now,
    },
    {
      key: 'kb:document-model:memorial-reforma-escolar',
      title: 'Memorial descritivo para reforma escolar',
      description: 'Modelo base de memorial descritivo para reformas em unidades escolares municipais.',
      type: 'document_model',
      status: 'published',
      tags: ['memorial', 'reforma', 'escola', 'prefeitura'],
      content: {
        sections: ['escopo', 'diagnostico', 'solucoes tecnicas', 'materiais', 'acessibilidade'],
      },
      publishedAt: now,
    },
    {
      key: 'kb:document-model:relatorio-fotografico-vistoria',
      title: 'Relatorio fotografico de vistoria inicial',
      description: 'Estrutura recomendada para registro de vistoria inicial com fotos antes/depois.',
      type: 'document_model',
      status: 'draft',
      tags: ['relatorio-fotografico', 'vistoria', 'levantamento'],
      content: {
        requiredFields: ['local', 'data', 'responsavel', 'contexto', 'evidencias'],
      },
      publishedAt: null,
    },
    {
      key: 'kb:project-reference:ubs-vila-esperanca',
      title: 'Construcao da UBS Vila Esperanca',
      description: 'Projeto de referencia para novas UBS com foco em padrao de compatibilizacao e entrega.',
      type: 'project_reference',
      status: 'published',
      tags: ['ubs', 'saude', 'projeto-referencia'],
      content: {
        summary: 'Referencia criada a partir de projeto real de UBS.',
        sections: [
          {
            title: 'Motivo da promocao',
            body: 'Projeto com bom nivel de rastreabilidade e compatibilizacao entre disciplinas.',
          },
          {
            title: 'Quando usar esta referencia',
            body: 'Usar em novos projetos de UBS com escopo semelhante.',
          },
          {
            title: 'Alertas e observacoes',
            body: 'Revisar compatibilizacao e conferencias de quantitativos antes da entrega.',
          },
        ],
        metadata: {
          source: 'project',
          sourceProjectId: projects[1].id,
          sourceProjectName: 'Construcao da UBS Vila Esperanca',
          sourceProjectType: 'unidade de saude',
        },
      },
      publishedAt: now,
    },
    {
      key: 'kb:project-reference:escola-jardim-primavera',
      title: 'Reforma da Escola Municipal Jardim Primavera',
      description: 'Referencia para projetos de reforma escolar com exigencias de acessibilidade.',
      type: 'project_reference',
      status: 'published',
      tags: ['escola', 'reforma', 'acessibilidade', 'projeto-referencia'],
      content: {
        summary: 'Referencia criada a partir de projeto real de reforma escolar.',
        sections: [
          {
            title: 'Motivo da promocao',
            body: 'Projeto bem estruturado, com memorial consistente e fluxo de revisao rastreavel.',
          },
          {
            title: 'Quando usar esta referencia',
            body: 'Usar como base em reformas escolares com foco em acessibilidade.',
          },
          {
            title: 'Alertas e observacoes',
            body: 'Validar cobertura e compatibilidade entre memorial e orcamento.',
          },
        ],
        metadata: {
          source: 'project',
          sourceProjectId: projects[0].id,
          sourceProjectName: 'Reforma da Escola Municipal Jardim Primavera',
          sourceProjectType: 'reforma escolar',
        },
      },
      publishedAt: now,
    },
    {
      key: 'kb:lesson-learned:divergencia-quantitativos-ubs',
      title: 'Divergencia de quantitativos em orcamento de UBS',
      description: 'Licao aprendida: validar quantitativos com arquitetura antes do fechamento do orcamento.',
      type: 'lesson_learned',
      status: 'published',
      tags: ['orcamento', 'ubs', 'quantitativos', 'licao-aprendida'],
      content: {
        summary: 'Licao aprendida registrada a partir de revisao reprovada.',
        sections: [
          {
            title: 'Contexto',
            body: 'Durante a revisao do orcamento da UBS Vila Esperanca.',
          },
          {
            title: 'Problema identificado',
            body: 'Quantitativos de piso e revestimento nao batiam com memorial.',
          },
          {
            title: 'Impacto',
            body: 'Reprovacao da revisao e atraso na entrega.',
          },
          {
            title: 'Recomendacao',
            body: 'Comparar quantitativos principais com memorial e pranchas antes do envio.',
          },
          {
            title: 'Quando observar novamente',
            body: 'Projetos de UBS e reformas com orcamento por ambiente.',
          },
        ],
        metadata: {
          source: 'review',
          sourceReviewId: uuidFromText('review:orcamento-r01'),
          sourceReviewStatus: 'rejected',
          sourceProjectId: projects[1].id,
          sourceProjectName: 'Construcao da UBS Vila Esperanca',
          sourceDeliverableName: 'Orcamento',
          sourceDocumentTitle: 'Planilha Orcamentaria - UBS Vila Esperanca',
        },
      },
      publishedAt: now,
    },
    {
      key: 'kb:lesson-learned:compatibilizacao-tardia-arq-hid',
      title: 'Compatibilizacao tardia entre arquitetura e hidraulica',
      description: 'Aprendizado sobre antecipar compatibilizacao para reduzir retrabalho em fase de revisao.',
      type: 'lesson_learned',
      status: 'deprecated',
      tags: ['compatibilizacao', 'arquitetura', 'hidraulica', 'retrabalho'],
      content: {
        note: 'Processo antigo depreciado apos adocao de gate de compatibilizacao inicial.',
      },
      publishedAt: now,
      deprecatedAt: now,
    },
    {
      key: 'kb:review-checklist:revisao-orcamento',
      title: 'Revisao de orcamento antes de envio ao cliente',
      description: 'Checklist de revisao tecnica e financeira para evitar inconsistencias no envio.',
      type: 'review_checklist',
      status: 'published',
      tags: ['checklist', 'revisao', 'orcamento'],
      content: {
        summary: 'Checklist para revisar orcamento antes de envio ao cliente.',
        sections: [
          {
            title: 'Quando usar',
            body: 'Usar antes de enviar orcamento para revisao tecnica, cliente ou prefeitura.',
          },
          {
            title: 'Etapa indicada',
            body: 'Pre-entrega do orcamento e revisao final de quantitativos.',
          },
        ],
        checklist: [
          { label: 'Conferir quantitativos principais.', required: true },
          { label: 'Comparar orcamento com memorial descritivo.', required: true },
          { label: 'Validar unidades de medida.', required: true },
          { label: 'Conferir itens sem preco ou com preco zerado.', required: true },
          { label: 'Validar data-base e BDI.', required: true },
        ],
      },
      publishedAt: now,
    },
    {
      key: 'kb:delivery-standard:pacote-tecnico-prefeitura',
      title: 'Pacote tecnico para prefeitura',
      description: 'Padrao de entrega final para prefeituras com estrutura de pastas e documentos obrigatorios.',
      type: 'delivery_standard',
      status: 'archived',
      tags: ['entrega', 'prefeitura', 'pacote-final'],
      content: {
        summary: 'Padrao para organizar pacote tecnico antes de envio para prefeitura.',
        sections: [
          {
            title: 'Padrao de entrega',
            body: 'Pacote tecnico com documentos finais, memoriais, orcamento e cronograma.',
          },
          {
            title: 'Formato de envio',
            body: 'Arquivos finais em PDF com nomenclatura padronizada e revisao identificada.',
          },
          {
            title: 'Conferencias antes da entrega',
            body: 'Confirmar versoes oficiais e ausencia de revisoes pendentes.',
          },
        ],
        checklist: [
          { label: 'Confirmar versao oficial dos documentos.', required: true },
          { label: 'Conferir nomenclatura dos arquivos.', required: true },
          { label: 'Verificar ART/RRT.', required: true },
          { label: 'Conferir pendencias de revisao.', required: true },
        ],
      },
      publishedAt: now,
      archivedAt: now,
    },
  ];

  for (const item of items) {
    await query(
      `
        INSERT INTO knowledge_items (
          id, organization_id, title, description, type, status, visibility,
          content, tags, created_by, updated_by, published_at, archived_at, deprecated_at,
          created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8::jsonb, $9::jsonb, $10, $11, $12, $13, $14,
          now(), now()
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          type = EXCLUDED.type,
          status = EXCLUDED.status,
          visibility = EXCLUDED.visibility,
          content = EXCLUDED.content,
          tags = EXCLUDED.tags,
          created_by = EXCLUDED.created_by,
          updated_by = EXCLUDED.updated_by,
          published_at = EXCLUDED.published_at,
          archived_at = EXCLUDED.archived_at,
          deprecated_at = EXCLUDED.deprecated_at,
          updated_at = now()
      `,
      [
        uuidFromText(item.key),
        organizationId,
        item.title,
        item.description,
        item.type,
        item.status,
        'organization',
        JSON.stringify(item.content),
        JSON.stringify(item.tags),
        author,
        reviewer,
        item.publishedAt ?? null,
        item.archivedAt ?? null,
        item.deprecatedAt ?? null,
      ],
    );
  }
}

async function seedKnowledgeRelations(query: Query): Promise<void> {
  const relations = [
    {
      key: 'kb-rel:project-ref-escola-based-on-project',
      knowledgeKey: 'kb:project-reference:escola-jardim-primavera',
      relationType: 'based_on',
      targetType: 'project',
      targetId: projects[0].id,
    },
    {
      key: 'kb-rel:project-ref-ubs-based-on-project',
      knowledgeKey: 'kb:project-reference:ubs-vila-esperanca',
      relationType: 'based_on',
      targetType: 'project',
      targetId: projects[1].id,
    },
    {
      key: 'kb-rel:document-model-memorial-based-on-document',
      knowledgeKey: 'kb:document-model:memorial-reforma-escolar',
      relationType: 'based_on',
      targetType: 'document',
      targetId: uuidFromText(`document:${projects[0].id}:Memorial Descritivo - Reforma Escolar`),
    },
    {
      key: 'kb-rel:lesson-from-review-orcamento-r01',
      knowledgeKey: 'kb:lesson-learned:divergencia-quantitativos-ubs',
      relationType: 'lesson_from',
      targetType: 'review',
      targetId: uuidFromText('review:orcamento-r01'),
    },
    {
      key: 'kb-rel:lesson-from-project-ubs',
      knowledgeKey: 'kb:lesson-learned:divergencia-quantitativos-ubs',
      relationType: 'lesson_from',
      targetType: 'project',
      targetId: projects[1].id,
    },
    {
      key: 'kb-rel:checklist-for-project-ubs',
      knowledgeKey: 'kb:review-checklist:revisao-orcamento',
      relationType: 'checklist_for',
      targetType: 'project',
      targetId: projects[1].id,
    },
    {
      key: 'kb-rel:standard-for-project-ubs',
      knowledgeKey: 'kb:technical-standard:organizacao-disciplinas-ubs',
      relationType: 'standard_for',
      targetType: 'project',
      targetId: projects[1].id,
    },
    {
      key: 'kb-rel:delivery-standard-for-project-ubs',
      knowledgeKey: 'kb:delivery-standard:pacote-tecnico-prefeitura',
      relationType: 'standard_for',
      targetType: 'project',
      targetId: projects[1].id,
    },
  ];

  for (const relation of relations) {
    await query(
      `
        INSERT INTO knowledge_relations (
          id, organization_id, knowledge_item_id, target_type, target_id, relation_type, created_by, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, now())
        ON CONFLICT (id) DO UPDATE SET
          target_type = EXCLUDED.target_type,
          target_id = EXCLUDED.target_id,
          relation_type = EXCLUDED.relation_type
      `,
      [
        uuidFromText(relation.key),
        organizationId,
        uuidFromText(relation.knowledgeKey),
        relation.targetType,
        relation.targetId,
        relation.relationType,
        'Lucas Eduardo',
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
  ];

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

async function seedTechnicalTags(query: Query): Promise<void> {
  const creator = 'admin@engflow.local';
  const seedByCategory: Array<{ category: string; names: string[] }> = [
    { category: 'project_type', names: ['UBS', 'Reforma escolar', 'Praca publica', 'Pavimentacao', 'Drenagem', 'Obra publica'] },
    { category: 'technical_discipline', names: ['Arquitetura', 'Estrutura', 'Hidraulica', 'Eletrica', 'Orcamento', 'Cronograma', 'Acessibilidade'] },
    { category: 'document_type', names: ['Memorial descritivo', 'Relatorio fotografico', 'Planilha orcamentaria', 'Cronograma fisico-financeiro', 'ART/RRT', 'Prancha tecnica'] },
    { category: 'operational_pain', names: ['Retrabalho', 'Revisao reprovada', 'Quantitativos divergentes', 'Nomenclatura incorreta', 'Falta de compatibilizacao', 'Documento incompleto', 'Versao errada'] },
    { category: 'client_context', names: ['Prefeitura SP', 'Orgao publico', 'Licitacao', 'Contrato publico', 'Zeladoria urbana'] },
    { category: 'project_stage', names: ['Levantamento', 'Projeto basico', 'Projeto executivo', 'Revisao', 'Entrega final', 'Pos-entrega'] },
    { category: 'knowledge_purpose', names: ['Padrao tecnico', 'Documento modelo', 'Projeto de referencia', 'Licao aprendida', 'Checklist de revisao', 'Padrao de entrega'] },
  ];

  for (const group of seedByCategory) {
    for (const name of group.names) {
      const slug = normalizeTechnicalTagSlug(name);
      await query(
        `
          INSERT INTO technical_tags (
            id, organization_id, name, slug, category, description, status, created_by, updated_by, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $7, now(), now())
          ON CONFLICT (organization_id, slug) DO UPDATE SET
            name = EXCLUDED.name,
            category = EXCLUDED.category,
            updated_by = EXCLUDED.updated_by,
            updated_at = now()
        `,
        [
          uuidFromText(`technical-tag:${organizationId}:${slug}`),
          organizationId,
          name,
          slug,
          group.category,
          null,
          creator,
        ],
      );
    }
  }
}

async function seedProjectTags(query: Query): Promise<void> {
  const actor = 'admin@engflow.local';
  const projectTags = new Map<string, string[]>([
    [
      projects[0].id,
      ['Reforma escolar', 'Prefeitura SP', 'Acessibilidade', 'Projeto executivo'],
    ],
    [
      projects[1].id,
      ['UBS', 'Prefeitura SP', 'Obra publica', 'Orcamento', 'Projeto executivo'],
    ],
    [
      projects[2].id,
      ['Praca publica', 'Zeladoria urbana', 'Orcamento', 'Projeto basico'],
    ],
    [
      projects[3].id,
      ['Pavimentacao', 'Drenagem', 'Orgao publico', 'Planilha orcamentaria'],
    ],
    [
      projects[4].id,
      ['Drenagem', 'Orgao publico', 'Projeto executivo', 'Revisao'],
    ],
  ]);

  for (const [projectId, tagNames] of projectTags.entries()) {
    const uniqueTagNames = [...new Set(tagNames)];

    for (const tagName of uniqueTagNames) {
      const slug = normalizeTechnicalTagSlug(tagName);
      await query(
        `
          INSERT INTO project_tags (
            id, organization_id, project_id, tag_id, source, created_by, created_at
          )
          VALUES ($1, $2, $3, $4, 'manual', $5, now())
          ON CONFLICT (organization_id, project_id, tag_id) DO UPDATE SET
            source = EXCLUDED.source
        `,
        [
          uuidFromText(`project-tag:${organizationId}:${projectId}:${slug}`),
          organizationId,
          projectId,
          uuidFromText(`technical-tag:${organizationId}:${slug}`),
          actor,
        ],
      );
    }
  }
}

async function seedDeliverableTags(query: Query): Promise<void> {
  const actor = 'admin@engflow.local';
  const deliverableTagsByName = new Map<string, string[]>([
    ['Projeto arquitetonico', ['Arquitetura', 'Prancha tecnica', 'Projeto executivo']],
    ['Projeto estrutural', ['Estrutura', 'Prancha tecnica', 'Projeto executivo']],
    ['Projeto eletrico', ['Eletrica', 'Prancha tecnica', 'Projeto executivo']],
    ['Projeto hidraulico', ['Hidraulica', 'Prancha tecnica', 'Falta de compatibilizacao']],
    ['Memorial descritivo', ['Memorial descritivo', 'Documento modelo', 'Prefeitura SP']],
    ['Orcamento', ['Orcamento', 'Planilha orcamentaria', 'Quantitativos divergentes']],
    ['Cronograma fisico-financeiro', ['Cronograma', 'Cronograma fisico-financeiro', 'Entrega final']],
    ['Relatorio fotografico', ['Relatorio fotografico', 'Levantamento', 'Documento incompleto']],
    ['Projeto de drenagem', ['Drenagem', 'Projeto executivo', 'Orgao publico']],
    ['Projeto de pavimentacao', ['Pavimentacao', 'Projeto executivo', 'Orgao publico']],
    ['Projeto paisagistico', ['Praca publica', 'Projeto basico', 'Zeladoria urbana']],
    ['Projeto de iluminacao', ['Eletrica', 'Praca publica', 'Zeladoria urbana']],
  ]);

  for (const project of projects) {
    const template = templates.find((item) => item.id === project.templateId);
    if (!template) continue;

    for (const deliverableName of template.deliverables) {
      const deliverableId = uuidFromText(
        `deliverable:${project.id}:${deliverableName}`,
      );
      const tagNames =
        deliverableTagsByName.get(deliverableName) ??
        [deliverableTypeFromName(deliverableName) === 'technical_report' ? 'Projeto executivo' : 'Prancha tecnica'];

      for (const tagName of [...new Set(tagNames)]) {
        const slug = normalizeTechnicalTagSlug(tagName);
        await query(
          `
            INSERT INTO deliverable_tags (
              id, organization_id, deliverable_id, tag_id, source, created_by, created_at
            )
            VALUES ($1, $2, $3, $4, 'manual', $5, now())
            ON CONFLICT (organization_id, deliverable_id, tag_id) DO UPDATE SET
              source = EXCLUDED.source
          `,
          [
            uuidFromText(
              `deliverable-tag:${organizationId}:${deliverableId}:${slug}`,
            ),
            organizationId,
            deliverableId,
            uuidFromText(`technical-tag:${organizationId}:${slug}`),
            actor,
          ],
        );
      }
    }
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
      await seedKnowledgeBase(query);
      await seedKnowledgeRelations(query);
      await seedTechnicalTags(query);
      await seedProjectTags(query);
      await seedDeliverableTags(query);
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
