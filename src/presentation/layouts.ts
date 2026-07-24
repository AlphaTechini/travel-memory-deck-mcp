import type { ImagePlacement } from "./theme.js";

export type MemoryLayout = "SINGLE_HERO_RIGHT" | "DOUBLE_COLLAGE_RIGHT" | "TRIPLE_HERO_COLLAGE_RIGHT" | "FOUR_GRID_RIGHT";

export function selectMemoryLayout(imageCount: number): MemoryLayout {
	switch (imageCount) {
		case 1:
			return "SINGLE_HERO_RIGHT";
		case 2:
			return "DOUBLE_COLLAGE_RIGHT";
		case 3:
			return "TRIPLE_HERO_COLLAGE_RIGHT";
		case 4:
			return "FOUR_GRID_RIGHT";
		default:
			throw new Error("A memory must include between one and four images.");
	}
}

export function getImagePlacements(layout: MemoryLayout): ImagePlacement[] {
	switch (layout) {
		case "SINGLE_HERO_RIGHT":
			return [{ x: 5.42, y: 0.92, width: 6.98, height: 5.68 }];
		case "DOUBLE_COLLAGE_RIGHT":
			return [
				{ x: 5.52, y: 1.22, width: 4.52, height: 4.96, rotate: -2 },
				{ x: 8.96, y: 2.22, width: 3.32, height: 3.1, rotate: 3 }
			];
		case "TRIPLE_HERO_COLLAGE_RIGHT":
			return [
				{ x: 7.22, y: 1.13, width: 4.32, height: 4.92 },
				{ x: 5.38, y: 1.2, width: 3.18, height: 3.4, rotate: -3 },
				{ x: 9.78, y: 3.6, width: 2.58, height: 2.52, rotate: 3 }
			];
		case "FOUR_GRID_RIGHT":
			return [
				{ x: 5.45, y: 1.13, width: 3.2, height: 2.35 },
				{ x: 9.02, y: 1.13, width: 3.2, height: 2.35 },
				{ x: 5.45, y: 3.97, width: 3.2, height: 2.35 },
				{ x: 9.02, y: 3.97, width: 3.2, height: 2.35 }
			];
	}
}
