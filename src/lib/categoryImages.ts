import type { ImageMetadata } from 'astro';

type ImageModule = { default: ImageMetadata };

const imageModules = import.meta.glob<ImageModule>('../pic/categories/*.png', {
	eager: true,
});

const categoryImages: Record<string, ImageMetadata> = Object.fromEntries(
	Object.entries(imageModules).flatMap(([path, imageModule]) => {
		const name = path.split('/').pop()?.replace(/\.png$/, '');
		return name ? [[name, imageModule.default]] : [];
	}),
);

export function categoryImageFor(category: string): ImageMetadata | undefined {
	return categoryImages[category.trim().toLowerCase()];
}
