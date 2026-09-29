export interface InfoAbschnitt {
	titel: string;
	codex_titel?: string;
	text?: string;
	codex_text?: string;
	liste?: string[];
	codex_liste?: string[];
}

export interface InfoTabelle {
	titel: string;
	codex_titel?: string;
	hinweis?: string;
	codex_hinweis?: string;
	spalten: string[];
	zeilen: string[][];
}

export interface Info {
	id: string;
	titel: string;
	codex_titel?: string;
	kategorie: string;
	intro: string;
	codex_intro?: string;
	abschnitte?: InfoAbschnitt[];
	tabelle?: InfoTabelle;
}

export interface InfoGruppe {
	slug: string;
	label: string;
	infos: Info[];
}

const KATEGORIE_LABELS: Record<string, string> = {
	ausruestung: 'Ausrüstung',
	grundlagen: 'Grundlagen',
	hygiene: 'Hygiene',
	kontrolle: 'Kontrolle',
	lagerung: 'Lagerung',
	probleme: 'Probleme',
	salz: 'Salz',
	textur: 'Textur',
	zutaten: 'Zutaten',
};

export function infoKategorieLabel(slug: string): string {
	const label = KATEGORIE_LABELS[slug];
	if (label) return label;
	return slug.charAt(0).toLocaleUpperCase('de') + slug.slice(1).replaceAll('-', ' ');
}

export function codexText(codex?: string, plain?: string): string {
	return codex ?? plain ?? '';
}

export function codexListe(codex?: string[], plain?: string[]): string[] {
	return codex ?? plain ?? [];
}

export function gruppiereInfos(infos: Info[]): InfoGruppe[] {
	const map = new Map<string, InfoGruppe>();

	for (const info of infos) {
		const existing = map.get(info.kategorie);
		if (existing) {
			existing.infos.push(info);
			continue;
		}
		map.set(info.kategorie, {
			slug: info.kategorie,
			label: infoKategorieLabel(info.kategorie),
			infos: [info],
		});
	}

	return [...map.values()].sort(
		(a, b) => b.infos.length - a.infos.length || a.label.localeCompare(b.label, 'de'),
	);
}
