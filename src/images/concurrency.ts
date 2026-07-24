export async function mapWithConcurrency<Input, Output>(
	values: readonly Input[],
	concurrency: number,
	map: (value: Input, index: number) => Promise<Output>
): Promise<Output[]> {
	const results = new Array<Output>(values.length);
	let nextIndex = 0;

	async function worker(): Promise<void> {
		while (nextIndex < values.length) {
			const index = nextIndex++;
			const value = values[index];
			if (value !== undefined) {
				results[index] = await map(value, index);
			}
		}
	}

	await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()));
	return results;
}
