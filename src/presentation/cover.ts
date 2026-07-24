import type { DeckCover } from "../types.js";
import type { Presentation } from "./pptx.js";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "./theme.js";

export function addCoverSlide(presentation: Presentation, cover: DeckCover): void {
	const slide = presentation.addSlide();
	slide.background = { color: "26323A" };

	slide.addShape("line", {
		x: 0.9,
		y: 2.03,
		w: 1.15,
		h: 0,
		line: { color: "DCA772", width: 2 }
	});
	slide.addText(cover.title, {
		x: 0.9,
		y: 2.35,
		w: 9.85,
		h: 1.55,
		margin: 0,
		fontFace: "Aptos Display",
		fontSize: 42,
		bold: true,
		color: "FAF7F2",
		fit: "shrink"
	});
	slide.addText(cover.subtext, {
		x: 0.93,
		y: 4.15,
		w: 7.8,
		h: 1.15,
		margin: 0,
		fontFace: "Aptos",
		fontSize: 18,
		color: "CDD4D7",
		fit: "shrink"
	});
	slide.addShape("line", {
		x: SLIDE_WIDTH - 2.1,
		y: SLIDE_HEIGHT - 1.1,
		w: 1.2,
		h: 0,
		line: { color: "DCA772", width: 1 }
	});
}
