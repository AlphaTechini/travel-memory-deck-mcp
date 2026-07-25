import { z } from "zod";

const EnvironmentSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
	PORT: z.coerce.number().int().min(1).max(65_535).default(8080),
	MONGODB_URI: z.url(),
	MONGODB_DATABASE: z.preprocess(
		(value) => (value === "" ? undefined : value),
		z.string().min(1).optional()
	),
	GCP_PROJECT_ID: z.string().min(1),
	GCS_BUCKET: z.string().min(3),
	CLOUD_TASKS_LOCATION: z.string().min(1),
	CLOUD_TASKS_QUEUE: z.string().min(1),
	CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL: z.email(),
	WORKER_BASE_URL: z.url(),
	MCP_PUBLIC_BASE_URL: z.url(),
	X402_NETWORK: z.enum(["eip155:1952", "eip155:196"]),
	X402_PAY_TO_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
	OKX_API_KEY: z.string().min(1),
	OKX_SECRET_KEY: z.string().min(1),
	OKX_PASSPHRASE: z.string().min(1)
});

export type AppConfig = z.output<typeof EnvironmentSchema>;

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
	const parsed = EnvironmentSchema.parse(environment);

	return parsed;
}
