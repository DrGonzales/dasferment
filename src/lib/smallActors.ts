import type { ImageMetadata } from 'astro';

type ImageModule = { default: ImageMetadata };

const imageModules = import.meta.glob<ImageModule>('../pic/smallactors/*.png', {
	eager: true,
});

export const smallActors: { name: string; image: ImageMetadata }[] = Object.entries(
	imageModules,
)
	.map(([path, imageModule]) => ({
		name: path.split('/').pop() ?? '',
		image: imageModule.default,
	}))
	.sort((a, b) => a.name.localeCompare(b.name, 'de', { numeric: true }));

export const SMALL_ACTOR_SIZE = 128;

function hash(value: string): number {
	let result = 2166136261;
	for (let index = 0; index < value.length; index += 1) {
		result ^= value.charCodeAt(index);
		result = Math.imul(result, 16777619);
	}
	return result >>> 0;
}

function shuffled<T>(values: T[], seed: string): T[] {
	const result = [...values];
	let state = hash(seed) || 1;

	for (let index = result.length - 1; index > 0; index -= 1) {
		state = (Math.imul(state, 48271) >>> 0) || 1;
		const target = state % (index + 1);
		[result[index], result[target]] = [result[target], result[index]];
	}

	return result;
}

export function assignPortraits<T extends { id: string }>(
	items: T[],
): (ImageMetadata | undefined)[] {
	if (smallActors.length === 0) return items.map(() => undefined);

	const fingerprint = items.map((item) => item.id).join('|');
	const deck = [
		...shuffled(smallActors, fingerprint),
		...shuffled(smallActors, `${fingerprint}#2`),
	];

	let previous = '';

	return items.map((_, index) => {
		const pick = index % deck.length;

		if (deck.length > 1 && deck[pick].name === previous) {
			const swap = (pick + 1) % deck.length;
			[deck[pick], deck[swap]] = [deck[swap], deck[pick]];
		}

		previous = deck[pick].name;
		return deck[pick].image;
	});
}
