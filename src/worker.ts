import { loadWorkerConfig } from "./config.js";
import { createWorkerServices } from "./services.js";
import { createWorkerApp } from "./worker-app.js";

const config = loadWorkerConfig();
const services = await createWorkerServices(config);
const app = createWorkerApp(services);

const close = async (): Promise<void> => {
	await app.close();
	await services.mongoClient.close();
};

process.once("SIGINT", () => void close());
process.once("SIGTERM", () => void close());

await app.listen({ host: "0.0.0.0", port: config.PORT });
