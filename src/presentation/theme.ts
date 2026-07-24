import type { TravelMemory } from "../types.js";
import type { Slide } from "./pptx.js";

export const SLIDE_WIDTH = 13.333;
export const SLIDE_HEIGHT = 7.5;

const BACKGROUND = "F7F3ED";
const INK = "1F2933";
const MUTED = "61707D";
const ACCENT = "B56B45";

export function applyBackground(slide: Slide): void {
	slide.background = { color: BACKGROUND };
}

export function addMemoryText(slide: Slide, memory: TravelMemory): void {
	slide.addShape("line", {
		x: 0.76,
		y: 1.16,
		w: 0.85,
		h: 0,
		line: { color: ACCENT, width: 1.5 }
	});

	slide.addText(memory.title, {
		x: 0.75,
		y: 1.45,
		w: 3.85,
		h: 1.35,
		margin: 0,
		fontFace: "Aptos Display",
		fontSize: 29,
		bold: true,
		color: INK,
		fit: "shrink",
		breakLine: false
	});

	slide.addText(memory.subtext, {
		x: 0.75,
		y: 3.02,
		w: 3.75,
		h: 2.55,
		margin: 0,
		fontFace: "Aptos",
		fontSize: 15,
		color: MUTED,
		breakLine: false,
		fit: "shrink",
		valign: "top",
		paraSpaceAfterPt: 8
	});
}

export function addImage(slide: Slide, image: string, placement: ImagePlacement, altText: string): void {
	slide.addImage({
		data: image,
		x: placement.x,
		y: placement.y,
		w: placement.width,
		h: placement.height,
		rotate: placement.rotate,
		altText
	});
}

export type ImagePlacement = {
	x: number;
	y: number;
	width: number;
	height: number;
	rotate?: number;
};
