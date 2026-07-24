import { createRequire } from "node:module";

type PptxOptions = Record<string, unknown>;

export type Slide = {
	background?: { color: string };
	addShape(shape: string, options: PptxOptions): void;
	addText(text: string, options: PptxOptions): void;
	addImage(options: PptxOptions): void;
};

export type Presentation = {
	layout: string;
	author: string;
	company: string;
	subject: string;
	title: string;
	addSlide(): Slide;
	write(options: { outputType: "uint8array"; compression: boolean }): Promise<Uint8Array>;
};

type PresentationConstructor = new () => Presentation;

const require = createRequire(import.meta.url);

// PptxGenJS 4.0.1 ships declarations written for TypeScript 3.x.
// Its CommonJS export remains stable, so this adapter keeps modern builds type-safe.
const PptxGenJS = require("pptxgenjs") as PresentationConstructor;

export function createPptxPresentation(): Presentation {
	return new PptxGenJS();
}
