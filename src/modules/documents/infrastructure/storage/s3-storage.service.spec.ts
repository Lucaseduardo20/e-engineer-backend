import { ConfigService } from '@nestjs/config';
import { S3StorageService } from './s3-storage.service';

describe('S3StorageService', () => {
  it('returns deterministic local s3 paths when credentials are not configured', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(123456);
    const config = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const storage = new S3StorageService(config);

    await expect(
      storage.upload({
        organizationId: 'org-1',
        documentId: 'doc-1',
        fileName: 'Memorial técnico.pdf',
        buffer: Buffer.from('pdf'),
      }),
    ).resolves.toBe(
      's3://local-documents/organizations/org-1/documents/doc-1/123456-Memorial-tecnico.pdf',
    );

    jest.restoreAllMocks();
  });
});
