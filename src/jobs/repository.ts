import { randomUUID } from "node:crypto";

import type { Collection, Db } from "mongodb";

import type { DeckJob, DeckRequest } from "../types.js";

type DeckJobDocument = Omit<DeckJob, "id"> & {
	_id: string;
};

const FAILED_JOB_RETENTION_MS = 24 * 60 * 60 * 1000;
const EXPIRED_JOB_METADATA_RETENTION_MS = 60 * 60 * 1000;

function toJob(document: DeckJobDocument): DeckJob {
	const { _id, ...job } = document;
	return { id: _id, ...job };
}

export class DeckJobRepository {
	private readonly collection: Collection<DeckJobDocument>;

	constructor(database: Db) {
		this.collection = database.collection<DeckJobDocument>("deckJobs");
	}

	async ensureIndexes(): Promise<void> {
		await Promise.all([
			this.collection.createIndex({ ownerId: 1, _id: 1 }),
			this.collection.createIndex({ paymentId: 1 }, { unique: true, sparse: true }),
			this.collection.createIndex({ purgeAt: 1 }, { expireAfterSeconds: 0 })
		]);
	}

	async createPaid(ownerId: string, request: DeckRequest, paymentId: string): Promise<DeckJob> {
		const createdAt = new Date();
		const document: DeckJobDocument = {
			_id: randomUUID(),
			ownerId,
			paymentId,
			request,
			status: "queued",
			createdAt,
			purgeAt: new Date(createdAt.getTime() + FAILED_JOB_RETENTION_MS)
		};

		const result = await this.collection.findOneAndUpdate(
			{ paymentId },
			{ $setOnInsert: document },
			{ upsert: true, returnDocument: "after" }
		);

		if (!result || result.ownerId !== ownerId) {
			throw new Error("Payment authorization is already bound to a different deck job.");
		}

		return toJob(result);
	}

	async findOwned(id: string, ownerId: string): Promise<DeckJob | null> {
		const document = await this.collection.findOne({ _id: id, ownerId });
		return document ? toJob(document) : null;
	}

	async claim(id: string): Promise<DeckJob | null> {
		const document = await this.collection.findOneAndUpdate(
			{ _id: id, status: "queued", paymentId: { $type: "string" } },
			{ $set: { status: "processing", startedAt: new Date() } },
			{ returnDocument: "after" }
		);

		return document ? toJob(document) : null;
	}

	async markCompleted(
		id: string,
		result: { objectKey: string; downloadUrl: string; expiresAt: Date }
	): Promise<void> {
		await this.collection.updateOne(
			{ _id: id, status: "processing" },
			{
				$set: {
					status: "completed",
					completedAt: new Date(),
					objectKey: result.objectKey,
					downloadUrl: result.downloadUrl,
					expiresAt: result.expiresAt,
					// TTL cleanup is deliberately later than the exact-expiry task.
					// The task needs the object key to delete the GCS deck first.
					purgeAt: new Date(result.expiresAt.getTime() + EXPIRED_JOB_METADATA_RETENTION_MS)
				}
			}
		);
	}

	async markFailed(id: string, message: string): Promise<void> {
		await this.collection.updateOne(
			{ _id: id, status: { $in: ["queued", "processing"] } },
			{
				$set: {
					status: "failed",
					failureMessage: message,
					purgeAt: new Date(Date.now() + FAILED_JOB_RETENTION_MS)
				}
			}
		);
	}

	async requeue(id: string): Promise<void> {
		await this.collection.updateOne(
			{ _id: id, status: "processing" },
			{ $set: { status: "queued" }, $unset: { startedAt: "" } }
		);
	}

	async findForDeletion(id: string): Promise<DeckJob | null> {
		const document = await this.collection.findOne({ _id: id, status: "completed" });
		return document ? toJob(document) : null;
	}

	async markExpired(id: string): Promise<void> {
		await this.collection.updateOne(
			{ _id: id, status: "completed" },
			{
				$set: { status: "expired", purgeAt: new Date(Date.now() + EXPIRED_JOB_METADATA_RETENTION_MS) },
				$unset: { request: "", objectKey: "", downloadUrl: "", failureMessage: "" }
			}
		);
	}
}
