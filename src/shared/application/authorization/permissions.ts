export const permissions = {
  organization: {
    read: 'organization.read',
    updateProfile: 'organization.profile.update',
    updateLogo: 'organization.logo.update',
    membersRead: 'organization.members.read',
    membersManage: 'organization.members.manage',
    membersSecurityManage: 'organization.members.security.manage',
    membersClone: 'organization.members.clone',
  },
  priority: {
    request: 'priority.request',
    apply: 'priority.apply',
  },
  knowledge: {
    read: 'knowledge.read',
    create: 'knowledge.create',
    update: 'knowledge.update',
    publish: 'knowledge.publish',
    archive: 'knowledge.archive',
    deprecate: 'knowledge.deprecate',
    link: 'knowledge.link',
    unlink: 'knowledge.unlink',
    promoteProject: 'knowledge.promote_project',
    saveDocumentModel: 'knowledge.save_document_model',
    registerLesson: 'knowledge.register_lesson',
  },
  platform: {
    tenantsRead: 'platform.tenants.read',
    tenantSwitch: 'platform.tenant.switch',
    impersonate: 'platform.impersonate',
  },
} as const;

type LeafValues<T> = T extends string
  ? T
  : {
      [K in keyof T]: LeafValues<T[K]>;
    }[keyof T];

export type Permission = LeafValues<typeof permissions>;
