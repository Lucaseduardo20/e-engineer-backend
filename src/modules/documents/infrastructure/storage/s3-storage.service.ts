import { createHash, createHmac } from 'crypto';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DocumentStorageUpload {
  organizationId: string;
  documentId: string;
  fileName: string;
  contentType?: string;
  buffer: Buffer;
}

@Injectable()
export class S3StorageService {
  constructor(private readonly configService: ConfigService) {}

  async upload(input: DocumentStorageUpload): Promise<string> {
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');
    const region = this.configService.get<string>('AWS_REGION') ?? 'us-east-1';
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    const key = this.buildObjectKey(input);

    if (!bucket || !accessKeyId || !secretAccessKey) {
      return `s3://local-documents/${key}`;
    }

    const host = `${bucket}.s3.${region}.amazonaws.com`;
    const url = `https://${host}/${encodeURI(key)}`;
    const now = new Date();
    const amzDate = this.toAmzDate(now);
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = createHash('sha256').update(input.buffer).digest('hex');
    const canonicalHeaders = [
      `host:${host}`,
      `x-amz-content-sha256:${payloadHash}`,
      `x-amz-date:${amzDate}`,
    ].join('\n');
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = [
      'PUT',
      `/${encodeURI(key)}`,
      '',
      `${canonicalHeaders}\n`,
      signedHeaders,
      payloadHash,
    ].join('\n');
    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');
    const signingKey = this.getSignatureKey(secretAccessKey, dateStamp, region);
    const signature = createHmac('sha256', signingKey)
      .update(stringToSign)
      .digest('hex');
    const authorization = [
      `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`,
    ].join(', ');

    const response = await fetch(url, {
      method: 'PUT',
      body: input.buffer as unknown as BodyInit,
      headers: {
        Authorization: authorization,
        'Content-Type': input.contentType ?? 'application/octet-stream',
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
      },
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        `S3 upload failed with status ${response.status}.`,
      );
    }

    return `s3://${bucket}/${key}`;
  }

  private buildObjectKey(input: DocumentStorageUpload): string {
    const safeFileName = input.fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 180);

    return [
      'organizations',
      input.organizationId,
      'documents',
      input.documentId,
      `${Date.now()}-${safeFileName || 'arquivo'}`,
    ].join('/');
  }

  private toAmzDate(date: Date): string {
    return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  }

  private getSignatureKey(
    secretAccessKey: string,
    dateStamp: string,
    region: string,
  ): Buffer {
    const dateKey = createHmac('sha256', `AWS4${secretAccessKey}`)
      .update(dateStamp)
      .digest();
    const dateRegionKey = createHmac('sha256', dateKey).update(region).digest();
    const dateRegionServiceKey = createHmac('sha256', dateRegionKey)
      .update('s3')
      .digest();

    return createHmac('sha256', dateRegionServiceKey)
      .update('aws4_request')
      .digest();
  }
}
