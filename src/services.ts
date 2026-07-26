import { MongoClient } from "mongodb";

import type { ApiConfig, CommonConfig, WorkerConfig } from "./config.js";
import { DeckJobRepository } from "./jobs/repository.js";
import { DeckTaskQueue } from "./jobs/queue.js";
import { PaymentLedger } from "./payments/ledger.js";
import { X402PaymentService } from "./payments/service.js";
import { DeckStorage } from "./storage/decks.js";

export type WorkerServices = {
	mongoClient: MongoClient;
	jobs: DeckJobRepository;
	tasks: DeckTaskQueue;
	storage: DeckStorage;
};

export type AppServices = WorkerServices & {
	payments: X402PaymentService;
};

type CoreServices = WorkerServices & {
	database: ReturnType<MongoClient["db"]>;
};

async function createCoreServices(config: CommonConfig): Promise<CoreServices> {
	const mongoClient = new MongoClient(config.MONGODB_URI);
	await mongoClient.connect();

	const database = mongoClient.db(config.MONGODB_DATABASE);
	const jobs = new DeckJobRepository(database);
	await jobs.ensureIndexes();

	return {
		mongoClient,
		jobs,
		tasks: new DeckTaskQueue(config),
		storage: new DeckStorage(config),
		database
	};
}

export async function createApiServices(config: ApiConfig): Promise<AppServices> {
	const { database, ...services } = await createCoreServices(config);
	const paymentLedger = new PaymentLedger(database);
	await paymentLedger.ensureIndexes();

	return {
		...services,
		payments: new X402PaymentService(config, paymentLedger)
	};
}

export async function createWorkerServices(config: WorkerConfig): Promise<WorkerServices> {
	const { database: _database, ...services } = await createCoreServices(config);
	return services;
}
