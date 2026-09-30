import Hypher from 'hypher';
import german from 'hyphenation.de';

// Chromium trennt nur mit Systemwörterbuch, und ein schlanker Container hat keines.
// Die Trennzeichen entstehen deshalb schon beim Buchbau, damit die Druckfassung
// unabhängig vom System immer gleich umbricht.
const hypher = new Hypher(german);

export function hyphenate(text: string): string {
	return hypher.hyphenateText(text);
}
