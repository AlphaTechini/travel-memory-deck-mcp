import { createApp } from "./app.js";
import { loadApiConfig } from "./config.js";
import { createApiServices } from "./services.js";

const config = loadApiConfig();
const services = await createApiServices(config);
const app = createApp(config, services);

const close = async (): Promise<void> => {
	await app.close();
	await services.mongoClient.close();
};

process.once("SIGINT", () => void close());
process.once("SIGTERM", () => void close());

await app.listen({ host: "0.0.0.0", port: config.PORT });
