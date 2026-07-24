import sharp from "sharp";

const MAX_INPUT_PIXELS = 40_000_000;
const RENDER_DPI = 150;

export type ImageFrame = {
	width: number;
	height: number;
};

export class ImageProcessingError extends Error {}

function createRoundedMask(width: number, height: number): Buffer {
	const radius = Math.max(12, Math.round(Math.min(width, height) * 0.055));
	const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="white"/></svg>`;
	return Buffer.from(svg);
}

export async function createRoundedImage(image: Buffer, frame: ImageFrame): Promise<string> {
	try {
		const metadata = await sharp(image, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
		if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) {
			throw new ImageProcessingError("Image content is not JPEG, PNG, or WebP.");
		}

		const width = Math.max(1, Math.round(frame.width * RENDER_DPI));
		const height = Math.max(1, Math.round(frame.height * RENDER_DPI));
		const rendered = await sharp(image, { limitInputPixels: MAX_INPUT_PIXELS })
			.rotate()
			.resize(width, height, { fit: "cover", position: "centre" })
			.composite([{ input: createRoundedMask(width, height), blend: "dest-in" }])
			.png()
			.toBuffer();

		return `data:image/png;base64,${rendered.toString("base64")}`;
	} catch (error) {
		if (error instanceof ImageProcessingError) {
			throw error;
		}
		throw new ImageProcessingError("Image could not be processed safely.");
	}
}
