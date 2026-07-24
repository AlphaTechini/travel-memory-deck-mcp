import { ImageFetchError } from "../images/fetch.js";
import { ImageProcessingError } from "../images/rounded-image.js";
import { createPresentation } from "../presentation/render.js";
import type { AppServices } from "../services.js";

const DECK_RETENTION_MS = 24 * 60 * 60 * 1000;

function createFailureMessage(error: unknown): string {
	if (error instanceof ImageFetchError || error instanceof ImageProcessingError) {
		return error.message;
	}
	return "The deck could not be rendered from the submitted memory data.";
}

export async function generateDeckJob(jobId: string, services: AppServices): Promise<void> {
	const job = await services.jobs.claim(jobId);
	if (!job || !job.request) {
		return;
	}

	let deck: Uint8Array;
	try {
		deck = await createPresentation(job.request);
	} catch (error) {
		await services.jobs.markFailed(job.id, createFailureMessage(error));
		return;
	}

	const objectKey = `decks/${job.id}.pptx`;
	const expiresAt = new Date(Date.now() + DECK_RETENTION_MS);
	try {
		await services.storage.upload(objectKey, deck);
		const downloadUrl = await services.storage.createDownloadUrl(objectKey, expiresAt);
		await services.tasks.enqueueDeletion(job.id, expiresAt);
		await services.jobs.markCompleted(job.id, { objectKey, downloadUrl, expiresAt });
	} catch (error) {
		await services.jobs.requeue(job.id);
		throw error;
	}
}
