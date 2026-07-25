import type { Collection, Db } from "mongodb";

import type { PaymentRecord } from "../types.js";

type PaymentRecordDocument = Omit<PaymentRecord, "id"> & {
	_id: string;
};

function toPaymentRecord(document: PaymentRecordDocument): PaymentRecord {
	const { _id, ...payment } = document;
	return { id: _id, ...payment };
}

export class PaymentLedger {
	private readonly collection: Collection<PaymentRecordDocument>;

	constructor(database: Db) {
		this.collection = database.collection<PaymentRecordDocument>("paymentLedger");
	}

	async ensureIndexes(): Promise<void> {
		await Promise.all([
			this.collection.createIndex({ ownerId: 1, createdAt: -1 }),
			this.collection.createIndex({ purgeAt: 1 }, { expireAfterSeconds: 0 })
		]);
	}

	async find(id: string): Promise<PaymentRecord | null> {
		const document = await this.collection.findOne({ _id: id });
		return document ? toPaymentRecord(document) : null;
	}

	async record(payment: PaymentRecord): Promise<PaymentRecord> {
		const document: PaymentRecordDocument = { _id: payment.id, ...payment };

		try {
			await this.collection.insertOne(document);
			return payment;
		} catch (error) {
			if (!isDuplicateKeyError(error)) {
				throw error;
			}

			const existing = await this.find(payment.id);
			if (!existing) {
				throw error;
			}

			return existing;
		}
	}
}

function isDuplicateKeyError(error: unknown): boolean {
	return typeof error === "object" && error !== null && "code" in error && error.code === 11_000;
}
