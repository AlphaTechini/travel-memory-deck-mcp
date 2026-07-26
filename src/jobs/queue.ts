import { CloudTasksClient } from "@google-cloud/tasks";

import type { TaskQueueConfig } from "../config.js";

export class DeckTaskQueue {
	private readonly client = new CloudTasksClient();
	private readonly parent: string;

	constructor(private readonly config: TaskQueueConfig) {
		this.parent = this.client.queuePath(
			config.GCP_PROJECT_ID,
			config.CLOUD_TASKS_LOCATION,
			config.CLOUD_TASKS_QUEUE
		);
	}

	async enqueueGeneration(jobId: string): Promise<void> {
		await this.enqueue("/internal/jobs/generate", { jobId });
	}

	async enqueueDeletion(jobId: string, scheduleAt: Date): Promise<void> {
		await this.enqueue("/internal/jobs/delete", { jobId }, scheduleAt);
	}

	private async enqueue(path: string, payload: { jobId: string }, scheduleAt?: Date): Promise<void> {
		const target = new URL(path, this.config.WORKER_BASE_URL);
		const body = Buffer.from(JSON.stringify(payload)).toString("base64");
		const task = {
			httpRequest: {
				url: target.toString(),
				httpMethod: "POST" as const,
				headers: { "Content-Type": "application/json" },
				body,
				oidcToken: {
					serviceAccountEmail: this.config.CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL,
					audience: this.config.WORKER_BASE_URL
				}
			},
			...(scheduleAt
				? { scheduleTime: { seconds: Math.floor(scheduleAt.getTime() / 1000) } }
				: {})
		};

		await this.client.createTask({ parent: this.parent, task });
	}
}
