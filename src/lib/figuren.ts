export interface Figur {
	id: string;
	/** Name der Ratgeberrolle, bestimmt das Portrait in `src/pic/actors/`. */
	sprecher: string;
	name: string;
	kicker: string;
	abschnitte: string[];
}

// Diese Texte stehen in der Website unter /ueber-diese-seite/ und im Buch nach
// dem Vorwort. Sie liegen hier, damit beide Ausgaben aus derselben Quelle
// kommen.
export const FIGUREN: Figur[] = [
	{
		id: 'connie',
		sprecher: 'Connie',
		name: 'Connie',
		kicker: 'Die Küchenmeisterin',
		abschnitte: [
			'Connie ist die begeisterte Küchenmeisterin und neugierige Entdeckerin des Werkes. Sie probiert aus, erklärt, beobachtet und ist sich auch für ungewöhnliche Kombinationen nicht zu schade. Mal arbeitet sie konzentriert, mal völlig übermütig, mal staunt sie selbst über das Ergebnis. Ihre mittelalterliche Nonnentracht, das dunkle Haar und der auffällige Kreuzanhänger sind zu ihrem wiederkehrenden Erscheinungsbild geworden.',
			'Connie steht dabei vor allem für Neugier, Freude am Ausprobieren und die Lust, Wissen weiterzugeben.',
		],
	},
	{
		id: 'katze',
		sprecher: 'Katze',
		name: 'Katze',
		kicker: 'Der Gefährte',
		abschnitte: [
			'Katze ist Connies etwas eigenwilliger Gefährte. Er ist aufmerksam, neugierig und häufig deutlich skeptischer als Connie. Manchmal ist er begeistert, manchmal verwirrt, manchmal erschrocken – und gelegentlich muss er Connie sogar mit erhobener Pfote zur Ordnung rufen.',
			'Gerade diese Gegensätze machen die beiden aus: Connie probiert – Katze hinterfragt. Connie erklärt – Katze staunt. Und manchmal geht beim gemeinsamen Fermentieren auch etwas schief.',
		],
	},
];
