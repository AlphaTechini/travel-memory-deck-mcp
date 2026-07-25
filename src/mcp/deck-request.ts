import { z } from "zod";

import type { DeckRequest } from "../types.js";

const ImageUrlSchema = z.url().refine((value) => new URL(value).protocol === "https:", {
	message: "Image URLs must use HTTPS."
});

const MemorySchema = z
	.object({
		title: z.string().trim().min(1).max(120),
		subtext: z.string().trim().min(1).max(1_500),
		imageUrls: z.array(ImageUrlSchema).min(1).max(4)
	})
	.strict();

export const CreateDeckInputSchema = z
	.object({
		cover: z
			.object({
				title: z.string().trim().min(1).max(160),
				subtext: z.string().trim().min(1).max(1_000)
			})
			.strict(),
		memories: z.array(MemorySchema).min(1).max(19)
	})
	.strict();

export function parseDeckRequest(value: unknown): DeckRequest | null {
	const result = CreateDeckInputSchema.safeParse(value);
	return result.success ? result.data : null;
}
