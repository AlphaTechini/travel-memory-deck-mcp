import { z } from "zod";

const EnvironmentSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	PORT: z.coerce.number().int().min(1).max(65_535).default(8080),
	MONGODB_URI: z.url(),
	MONGODB_DATABASE: z.string().min(1),
	GCP_PROJECT_ID: z.string().min(1),
	GCS_BUCKET: z.string().min(3),
	CLOUD_TASKS_LOCATION: z.string().min(1),
	CLOUD_TASKS_QUEUE: z.string().min(1),
	CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL: z.email(),
	WORKER_BASE_URL: z.url(),
	MCP_ALLOWED_ORIGINS: z.string().default("")
	});

export type AppConfig = Omit<z.output<typeof EnvironmentSchema>, "MCP_ALLOWED_ORIGINS"> & {
	allowedOrigins: ReadonlySet<string>;
};

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
	const parsed = EnvironmentSchema.parse(environment);

	return {
		...parsed,
		allowedOrigins: new Set(
			parsed.MCP_ALLOWED_ORIGINS.split(",")
				.map((origin) => origin.trim())
				.filter(Boolean)
		)
	};
}
