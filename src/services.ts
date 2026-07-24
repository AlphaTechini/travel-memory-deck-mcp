import { MongoClient } from "mongodb";

import type { AppConfig } from "./config.js";
import { DeckJobRepository } from "./jobs/repository.js";
import { DeckTaskQueue } from "./jobs/queue.js";
import { DeckStorage } from "./storage/decks.js";

export type AppServices = {
	mongoClient: MongoClient;
	jobs: DeckJobRepository;
	tasks: DeckTaskQueue;
	storage: DeckStorage;
};

export async function createServices(config: AppConfig): Promise<AppServices> {
	const mongoClient = new MongoClient(config.MONGODB_URI);
	await mongoClient.connect();

	const jobs = new DeckJobRepository(mongoClient.db(config.MONGODB_DATABASE));
	await jobs.ensureIndexes();

	return {
		mongoClient,
		jobs,
		tasks: new DeckTaskQueue(config),
		storage: new DeckStorage(config)
	};
}
