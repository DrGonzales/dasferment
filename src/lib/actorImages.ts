import type { ImageMetadata } from 'astro';

type ImageModule = { default: ImageMetadata };

const actorModules = import.meta.glob<ImageModule>('../pic/actors/*.png', {
	eager: true,
});

const actorImages: Record<string, ImageMetadata> = Object.fromEntries(
	Object.entries(actorModules).flatMap(([path, imageModule]) => {
		const name = path.split('/').pop()?.replace(/\.png$/, '').toLowerCase();
		return name ? [[name, imageModule.default]] : [];
	}),
);

export function actorImageFor(sprecher: string): ImageMetadata | undefined {
	return actorImages[sprecher.trim().toLowerCase()];
}
