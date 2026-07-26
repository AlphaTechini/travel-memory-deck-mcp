import { z } from "zod";

const CommonEnvironmentSchema = z.object({
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
	WORKER_BASE_URL: z.url()
});

const ApiEnvironmentSchema = CommonEnvironmentSchema.extend({
	MCP_PUBLIC_BASE_URL: z.url(),
	X402_NETWORK: z.enum(["eip155:1952", "eip155:196"]),
	X402_PAY_TO_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
	OKX_API_KEY: z.string().min(1),
	OKX_SECRET_KEY: z.string().min(1),
	OKX_PASSPHRASE: z.string().min(1)
});

const WorkerEnvironmentSchema = CommonEnvironmentSchema;

export type CommonConfig = z.output<typeof CommonEnvironmentSchema>;
export type ApiConfig = z.output<typeof ApiEnvironmentSchema>;
export type WorkerConfig = z.output<typeof WorkerEnvironmentSchema>;

export type StorageConfig = Pick<CommonConfig, "GCS_BUCKET">;
export type TaskQueueConfig = Pick<
	CommonConfig,
		| "GCP_PROJECT_ID"
		| "CLOUD_TASKS_LOCATION"
		| "CLOUD_TASKS_QUEUE"
		| "CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL"
		| "WORKER_BASE_URL"
>;

export function loadApiConfig(environment: NodeJS.ProcessEnv = process.env): ApiConfig {
	return ApiEnvironmentSchema.parse(environment);
}

export function loadWorkerConfig(environment: NodeJS.ProcessEnv = process.env): WorkerConfig {
	return WorkerEnvironmentSchema.parse(environment);
}
