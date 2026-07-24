export type DeckCover = {
	title: string;
	subtext: string;
};

export type TravelMemory = {
	title: string;
	subtext: string;
	imageUrls: string[];
};

export type DeckRequest = {
	cover: DeckCover;
	memories: TravelMemory[];
};

export type DeckJobStatus = "queued" | "processing" | "completed" | "failed" | "expired";

export type DeckJob = {
	id: string;
	ownerId: string;
	request?: DeckRequest;
	status: DeckJobStatus;
	createdAt: Date;
	startedAt?: Date;
	completedAt?: Date;
	expiresAt?: Date;
	purgeAt?: Date;
	objectKey?: string;
	downloadUrl?: string;
	failureMessage?: string;
};

export type MarketplaceIdentity = {
	id: string;
};
