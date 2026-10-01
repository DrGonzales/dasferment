declare module 'hypher' {
	export interface HypherLanguage {
		id?: string;
		leftmin: number;
		rightmin: number;
		patterns: Record<string, string>;
		exceptions?: string;
		charSubstitution?: Record<string, string>;
	}

	export default class Hypher {
		constructor(language: HypherLanguage);
		hyphenate(word: string): string[];
		hyphenateText(text: string, minLength?: number): string;
	}
}

declare module 'hyphenation.de' {
	import type { HypherLanguage } from 'hypher';

	const language: HypherLanguage;
	export default language;
}
