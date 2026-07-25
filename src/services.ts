import { MongoClient } from "mongodb";

import type { AppConfig } from "./config.js";
import { DeckJobRepository } from "./jobs/repository.js";
import { DeckTaskQueue } from "./jobs/queue.js";
import { PaymentLedger } from "./payments/ledger.js";
import { X402PaymentService } from "./payments/service.js";
import { DeckStorage } from "./storage/decks.js";

export type AppServices = {
	mongoClient: MongoClient;
	jobs: DeckJobRepository;
	tasks: DeckTaskQueue;
	storage: DeckStorage;
	payments: X402PaymentService;
};

export async function createServices(config: AppConfig): Promise<AppServices> {
	const mongoClient = new MongoClient(config.MONGODB_URI);
	await mongoClient.connect();

	const database = mongoClient.db(config.MONGODB_DATABASE);
	const jobs = new DeckJobRepository(database);
	const paymentLedger = new PaymentLedger(database);
	await Promise.all([jobs.ensureIndexes(), paymentLedger.ensureIndexes()]);

	return {
		mongoClient,
		jobs,
		tasks: new DeckTaskQueue(config),
		storage: new DeckStorage(config),
		payments: new X402PaymentService(config, paymentLedger)
	};
}
