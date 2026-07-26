import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";

import { deleteDeckJob } from "./jobs/delete.js";
import { generateDeckJob } from "./jobs/generate.js";
import type { WorkerServices } from "./services.js";

const JobPayloadSchema = z.object({ jobId: z.string().uuid() }).strict();

export function createWorkerApp(services: WorkerServices): FastifyInstance {
	const app = Fastify({ logger: true, bodyLimit: 10_000 });

	app.get("/health", async () => ({ status: "ok" }));

	app.post("/internal/jobs/generate", async (request, reply) => {
		const { jobId } = JobPayloadSchema.parse(request.body);
		await generateDeckJob(jobId, services);
		return reply.code(204).send();
	});

	app.post("/internal/jobs/delete", async (request, reply) => {
		const { jobId } = JobPayloadSchema.parse(request.body);
		await deleteDeckJob(jobId, services);
		return reply.code(204).send();
	});

	return app;
}
