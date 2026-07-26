import { Storage } from "@google-cloud/storage";

import type { StorageConfig } from "../config.js";

const PPTX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

export class DeckStorage {
	private readonly storage = new Storage();
	private readonly bucket;

	constructor(config: StorageConfig) {
		this.bucket = this.storage.bucket(config.GCS_BUCKET);
	}

	async upload(objectKey: string, content: Uint8Array): Promise<void> {
		await this.bucket.file(objectKey).save(content, {
			resumable: false,
			validation: "crc32c",
			metadata: {
				contentType: PPTX_CONTENT_TYPE,
				cacheControl: "private, no-store"
			}
		});
	}

	async createDownloadUrl(objectKey: string, expiresAt: Date): Promise<string> {
		const [url] = await this.bucket.file(objectKey).getSignedUrl({
			version: "v4",
			action: "read",
			expires: expiresAt,
			responseDisposition: 'attachment; filename="travel-memory-book.pptx"',
			responseType: PPTX_CONTENT_TYPE
		});

		return url;
	}

	async delete(objectKey: string): Promise<void> {
		await this.bucket.file(objectKey).delete({ ignoreNotFound: true });
	}
}
