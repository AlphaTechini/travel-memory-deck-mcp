import { mapWithConcurrency } from "../images/concurrency.js";
import { downloadPublicImage } from "../images/fetch.js";
import { createRoundedImage } from "../images/rounded-image.js";
import type { DeckRequest, TravelMemory } from "../types.js";
import { addCoverSlide } from "./cover.js";
import { getImagePlacements, selectMemoryLayout } from "./layouts.js";
import { createPptxPresentation, type Presentation } from "./pptx.js";
import { addImage, addMemoryText, applyBackground } from "./theme.js";

const IMAGE_FETCH_CONCURRENCY = 4;

async function renderMemorySlide(
	presentation: Presentation,
	memory: TravelMemory
): Promise<void> {
	const layout = selectMemoryLayout(memory.imageUrls.length);
	const placements = getImagePlacements(layout);
	const images = await mapWithConcurrency(memory.imageUrls, IMAGE_FETCH_CONCURRENCY, async (url, index) => {
		const placement = placements[index];
		if (!placement) {
			throw new Error("Image placement is missing.");
		}
		const source = await downloadPublicImage(url);
		return createRoundedImage(source, { width: placement.width, height: placement.height });
	});

	const slide = presentation.addSlide();
	applyBackground(slide);
	addMemoryText(slide, memory);
	images.forEach((image, index) => {
		const placement = placements[index];
		if (placement) {
			addImage(slide, image, placement, `${memory.title} image ${index + 1}`);
		}
	});
}

export async function createPresentation(request: DeckRequest): Promise<Uint8Array> {
	const presentation = createPptxPresentation();
	presentation.layout = "LAYOUT_WIDE";
	presentation.author = "Travel Memory Deck MCP";
	presentation.company = "Travel Memory Deck MCP";
	presentation.subject = "Travel memory book";
	presentation.title = request.cover.title;

	addCoverSlide(presentation, request.cover);
	for (const memory of request.memories) {
		await renderMemorySlide(presentation, memory);
	}

	const output = await presentation.write({ outputType: "uint8array", compression: true });
	if (!(output instanceof Uint8Array)) {
		throw new Error("PptxGenJS did not return a binary deck.");
	}
	return output;
}
