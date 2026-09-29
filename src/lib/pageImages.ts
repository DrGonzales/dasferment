import type { ImageMetadata } from 'astro';
import type { Recipe } from './recipes';

type ImageModule = { default: ImageMetadata };

const imageModules = import.meta.glob<ImageModule>('../pic/pages/*.png', { eager: true });
export const pageImages: Record<string, ImageMetadata> = Object.fromEntries(
	Object.entries(imageModules).flatMap(([path, imageModule]) => {
		const filename = path.split('/').pop();
		return filename ? [[filename, imageModule.default]] : [];
	}),
);

export function imageForRecipe(recipe: Recipe): ImageMetadata | undefined {
	return recipe.picture ? pageImages[recipe.picture] : undefined;
}

export function coverImageFor(recipes: Recipe[]): ImageMetadata | undefined {
	for (const recipe of recipes) {
		const image = imageForRecipe(recipe);
		if (image) return image;
	}
	return undefined;
}
