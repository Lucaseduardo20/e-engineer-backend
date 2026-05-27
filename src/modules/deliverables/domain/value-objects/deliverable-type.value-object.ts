import { ValueObject } from '../../../../shared/domain/value-objects/value-object';

export type DeliverableTypeValue =
  | 'technical_survey'
  | 'architectural_project'
  | 'structural_project'
  | 'electrical_project'
  | 'hydraulic_project'
  | 'drainage_project'
  | 'paving_project'
  | 'landscaping_project'
  | 'lighting_project'
  | 'descriptive_memorial'
  | 'budget'
  | 'schedule'
  | 'art_rrt'
  | 'photographic_report'
  | 'technical_report'
  | 'other';

export const deliverableTypeValues: DeliverableTypeValue[] = [
  'technical_survey',
  'architectural_project',
  'structural_project',
  'electrical_project',
  'hydraulic_project',
  'drainage_project',
  'paving_project',
  'landscaping_project',
  'lighting_project',
  'descriptive_memorial',
  'budget',
  'schedule',
  'art_rrt',
  'photographic_report',
  'technical_report',
  'other',
];

export class DeliverableType extends ValueObject<{ value: DeliverableTypeValue }> {
  private constructor(value: DeliverableTypeValue) {
    super({ value });
  }

  static create(value: string): DeliverableType {
    if (!deliverableTypeValues.includes(value as DeliverableTypeValue)) {
      throw new Error(`Invalid deliverable type: ${value}`);
    }

    return new DeliverableType(value as DeliverableTypeValue);
  }

  static technicalReport(): DeliverableType {
    return new DeliverableType('technical_report');
  }

  static fromTitle(title: string): DeliverableType {
    const normalized = title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (normalized.includes('arquitetonico')) {
      return new DeliverableType('architectural_project');
    }

    if (normalized.includes('estrutural')) {
      return new DeliverableType('structural_project');
    }

    if (normalized.includes('eletrico')) {
      return new DeliverableType('electrical_project');
    }

    if (normalized.includes('hidraulico')) {
      return new DeliverableType('hydraulic_project');
    }

    if (normalized.includes('drenagem')) {
      return new DeliverableType('drainage_project');
    }

    if (normalized.includes('pavimentacao') || normalized.includes('geometrico')) {
      return new DeliverableType('paving_project');
    }

    if (normalized.includes('paisagistico')) {
      return new DeliverableType('landscaping_project');
    }

    if (normalized.includes('iluminacao')) {
      return new DeliverableType('lighting_project');
    }

    if (normalized.includes('memorial')) {
      return new DeliverableType('descriptive_memorial');
    }

    if (normalized.includes('orcamento') || normalized.includes('orcamentaria')) {
      return new DeliverableType('budget');
    }

    if (normalized.includes('cronograma')) {
      return new DeliverableType('schedule');
    }

    if (normalized.includes('art') || normalized.includes('rrt')) {
      return new DeliverableType('art_rrt');
    }

    if (normalized.includes('fotografico')) {
      return new DeliverableType('photographic_report');
    }

    if (normalized.includes('levantamento') || normalized.includes('topografico')) {
      return new DeliverableType('technical_survey');
    }

    return new DeliverableType('technical_report');
  }

  get value(): DeliverableTypeValue {
    return this.props.value;
  }
}
