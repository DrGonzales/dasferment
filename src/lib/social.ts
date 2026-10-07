import type { ImageTransform } from 'astro';

export const SITE_NAME = 'Das Ferment';
export const CARD_TARGET_WIDTH = 1200;
export const CARD_TARGET_HEIGHT = 630;

export interface SocialImage {
	url: string;
	width: number;
	height: number;
	alt: string;
}

type RenderedImage = {
	src: string;
};

type ImageRenderer = (options: ImageTransform) => Promise<RenderedImage>;

export interface SocialImageSource {
	width: number;
	height: number;
	alt: string;
}

export function socialCardOptions(): ImageTransform {
	return {
		width: CARD_TARGET_WIDTH,
		height: CARD_TARGET_HEIGHT,
		fit: 'cover',
		position: 'top',
		format: 'jpeg',
		quality: 72,
	};
}

export async function socialCard(
	render: ImageRenderer,
	image: SocialImageSource | undefined,
	toAbsoluteUrl: (path: string) => string,
): Promise<SocialImage | undefined> {
	if (!image) return undefined;

	const rendered = await render(socialCardOptions());

	return {
		url: toAbsoluteUrl(rendered.src),
		width: Math.min(image.width, CARD_TARGET_WIDTH),
		height: Math.min(image.height, CARD_TARGET_HEIGHT),
		alt: image.alt,
	};
}
