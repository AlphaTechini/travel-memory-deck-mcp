import type { AppServices } from "../services.js";

export async function deleteDeckJob(jobId: string, services: AppServices): Promise<void> {
	const job = await services.jobs.findForDeletion(jobId);
	if (!job || !job.objectKey) {
		return;
	}

	if (job.expiresAt && job.expiresAt.getTime() > Date.now()) {
		await services.tasks.enqueueDeletion(job.id, job.expiresAt);
		return;
	}

	await services.storage.delete(job.objectKey);
	await services.jobs.markExpired(job.id);
}
