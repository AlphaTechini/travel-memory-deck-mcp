import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request as httpsRequest } from "node:https";
import type { RequestOptions } from "node:https";
import type { IncomingMessage } from "node:http";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT_MS = 15_000;

export class ImageFetchError extends Error {}

type ResolvedAddress = {
	address: string;
	family: 4 | 6;
};

function isPublicIpv4(address: string): boolean {
	const parts = address.split(".").map(Number);
	if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
		return false;
	}

	const [first, second] = parts as [number, number, number, number];
	return !(
		first === 0 ||
		first === 10 ||
		first === 127 ||
		first >= 224 ||
		(first === 100 && second >= 64 && second <= 127) ||
		(first === 169 && second === 254) ||
		(first === 172 && second >= 16 && second <= 31) ||
		(first === 192 && (second === 0 || second === 2 || second === 168)) ||
		(first === 198 && (second === 18 || second === 19 || second === 51)) ||
		(first === 203 && second === 0)
	);
}

function isPublicIpv6(address: string): boolean {
	const normalized = address.toLowerCase();
	return !(
		normalized === "::" ||
		normalized === "::1" ||
		normalized.startsWith("::ffff:") ||
		normalized.startsWith("fc") ||
		normalized.startsWith("fd") ||
		normalized.startsWith("fe8") ||
		normalized.startsWith("fe9") ||
		normalized.startsWith("fea") ||
		normalized.startsWith("feb") ||
		normalized.startsWith("ff") ||
		normalized.startsWith("2001:db8")
	);
}

function isPublicAddress(address: string): boolean {
	const family = isIP(address);
	if (family === 4) {
		return isPublicIpv4(address);
	}
	if (family === 6) {
		return isPublicIpv6(address);
	}
	return false;
}

function validateUrl(input: string): URL {
	let url: URL;
	try {
		url = new URL(input);
	} catch {
		throw new ImageFetchError("Image URL is invalid.");
	}

	if (
		url.protocol !== "https:" ||
		url.username ||
		url.password ||
		(url.port && url.port !== "443") ||
		url.hostname === "localhost" ||
		url.hostname.endsWith(".local")
	) {
		throw new ImageFetchError("Image URL must be a public HTTPS URL without credentials.");
	}

	return url;
}

async function resolvePublicAddress(hostname: string): Promise<ResolvedAddress> {
	const resolved = await lookup(hostname, { all: true, verbatim: true });
	if (resolved.length === 0 || resolved.some((entry) => !isPublicAddress(entry.address))) {
		throw new ImageFetchError("Image URL resolves to a restricted network address.");
	}

	const first = resolved[0];
	if (!first) {
		throw new ImageFetchError("Image URL could not be resolved.");
	}

	return { address: first.address, family: first.family as 4 | 6 };
}

function requestImage(url: URL, address: ResolvedAddress): Promise<IncomingMessage> {
	return new Promise((resolve, reject) => {
		const lookupWithPinnedAddress = (
			_hostname: string,
			options:
				| { all?: boolean }
				| ((error: NodeJS.ErrnoException | null, result: unknown, family?: number) => void),
			callback?: (error: NodeJS.ErrnoException | null, result: unknown, family?: number) => void
		): void => {
			const done = typeof options === "function" ? options : callback;
			if (!done) {
				throw new ImageFetchError("Image download could not pin DNS resolution.");
			}
			if (typeof options !== "function" && options.all) {
				done(null, [{ address: address.address, family: address.family }]);
				return;
			}
			done(null, address.address, address.family);
		};

		const requestOptions: RequestOptions = {
				protocol: "https:",
				hostname: url.hostname,
				port: url.port || 443,
				path: `${url.pathname}${url.search}`,
				method: "GET",
				headers: {
					Accept: "image/jpeg,image/png,image/webp",
					"User-Agent": "travel-memory-deck/0.1"
				},
				lookup: lookupWithPinnedAddress as unknown as RequestOptions["lookup"]
			};
		const request = httpsRequest(requestOptions, (response) => resolve(response));

		request.setTimeout(REQUEST_TIMEOUT_MS, () => {
			request.destroy(new ImageFetchError("Image download timed out."));
		});
		request.once("error", (error) => reject(new ImageFetchError(`Image download failed: ${error.message}`)));
		request.end();
	});
}

async function readImageResponse(response: IncomingMessage): Promise<Buffer> {
	const contentType = response.headers["content-type"]?.split(";", 1)[0]?.toLowerCase();
	if (!contentType || !["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
		throw new ImageFetchError("Image URL did not return a supported image type.");
	}

	const declaredLength = Number(response.headers["content-length"] ?? 0);
	if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) {
		throw new ImageFetchError("Image exceeds the 10 MiB download limit.");
	}

	const chunks: Buffer[] = [];
	let size = 0;
	for await (const chunk of response) {
		const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
		size += buffer.length;
		if (size > MAX_IMAGE_BYTES) {
			response.destroy();
			throw new ImageFetchError("Image exceeds the 10 MiB download limit.");
		}
		chunks.push(buffer);
	}

	return Buffer.concat(chunks);
}

async function fetchImage(url: URL, redirectsRemaining: number): Promise<Buffer> {
	const address = await resolvePublicAddress(url.hostname);
	const response = await requestImage(url, address);
	const statusCode = response.statusCode ?? 0;

	if (statusCode >= 300 && statusCode < 400 && response.headers.location) {
		response.resume();
		if (redirectsRemaining === 0) {
			throw new ImageFetchError("Image URL exceeded the redirect limit.");
		}
		return fetchImage(validateUrl(new URL(response.headers.location, url).toString()), redirectsRemaining - 1);
	}

	if (statusCode !== 200) {
		response.resume();
		throw new ImageFetchError(`Image URL returned HTTP ${statusCode}.`);
	}

	return readImageResponse(response);
}

export async function downloadPublicImage(url: string): Promise<Buffer> {
	return fetchImage(validateUrl(url), MAX_REDIRECTS);
}
