import type { ImageMetadata } from 'astro';

type ImageModule = { default: ImageMetadata };

const actorModules = import.meta.glob<ImageModule>('../pic/actors/**/*.png', {
	eager: true,
});

const actorImages: Record<string, ImageMetadata> = {};

for (const [path, imageModule] of Object.entries(actorModules)) {
	const parts = path.split('/');
	const name = parts.pop()?.replace(/\.png$/, '').toLowerCase();
	if (!name) continue;

	const chapter = parts.pop()?.toLowerCase();
	if (chapter && chapter !== 'actors') {
		actorImages[`${chapter}/${name}`] = imageModule.default;
	}

	actorImages[name] ??= imageModule.default;
}

export function actorImageFor(
	sprecher: string,
	chapter?: string,
): ImageMetadata | undefined {
	const name = sprecher.trim().toLowerCase();
	if (chapter) {
		const image = actorImages[`${chapter.toLowerCase()}/${name}`];
		if (image) return image;
	}
	return actorImages[name];
}
