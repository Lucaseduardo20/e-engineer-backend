import { ValueObject } from '../../../../shared/domain/value-objects/value-object';

export type DocumentTypeValue =
  | 'memorial_descritivo'
  | 'projeto_estrutural'
  | 'projeto_arquitetonico'
  | 'projeto_eletrico'
  | 'projeto_hidrossanitario'
  | 'orcamento'
  | 'cronograma'
  | 'laudo'
  | 'relatorio_fotografico'
  | 'art_rrt'
  | 'levantamento_topografico'
  | 'especificacao_tecnica'
  | 'outro';

export const documentTypeValues: DocumentTypeValue[] = [
  'memorial_descritivo',
  'projeto_estrutural',
  'projeto_arquitetonico',
  'projeto_eletrico',
  'projeto_hidrossanitario',
  'orcamento',
  'cronograma',
  'laudo',
  'relatorio_fotografico',
  'art_rrt',
  'levantamento_topografico',
  'especificacao_tecnica',
  'outro',
];

export class DocumentType extends ValueObject<{ value: DocumentTypeValue }> {
  private constructor(value: DocumentTypeValue) {
    super({ value });
  }

  static create(value: string): DocumentType {
    if (!documentTypeValues.includes(value as DocumentTypeValue)) {
      throw new Error(`Invalid document type: ${value}`);
    }

    return new DocumentType(value as DocumentTypeValue);
  }

  static fromTitle(title: string): DocumentType {
    const normalized = title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (normalized.includes('memorial')) {
      return new DocumentType('memorial_descritivo');
    }

    if (normalized.includes('estrutural')) {
      return new DocumentType('projeto_estrutural');
    }

    if (normalized.includes('arquitet')) {
      return new DocumentType('projeto_arquitetonico');
    }

    if (normalized.includes('eletric')) {
      return new DocumentType('projeto_eletrico');
    }

    if (
      normalized.includes('hidrossanit') ||
      normalized.includes('hidraulic')
    ) {
      return new DocumentType('projeto_hidrossanitario');
    }

    if (normalized.includes('orcamento') || normalized.includes('orcament')) {
      return new DocumentType('orcamento');
    }

    if (normalized.includes('cronograma')) {
      return new DocumentType('cronograma');
    }

    if (normalized.includes('laudo') || normalized.includes('parecer')) {
      return new DocumentType('laudo');
    }

    if (normalized.includes('fotografic')) {
      return new DocumentType('relatorio_fotografico');
    }

    if (normalized.includes('art') || normalized.includes('rrt')) {
      return new DocumentType('art_rrt');
    }

    if (
      normalized.includes('topografic') ||
      normalized.includes('levantamento')
    ) {
      return new DocumentType('levantamento_topografico');
    }

    if (
      normalized.includes('especificacao') ||
      normalized.includes('tecnica')
    ) {
      return new DocumentType('especificacao_tecnica');
    }

    return new DocumentType('outro');
  }

  get value(): DocumentTypeValue {
    return this.props.value;
  }
}
