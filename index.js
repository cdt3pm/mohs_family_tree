const parse = require('csv-parse');
const fs = require('fs');
const getopts = require('getopts');
const StringBuilder = require('string-builder');

const options = getopts(process.argv.slice(2), {
  alias: { all: 'a' }
});
const personMap = {};
const parser = parse({
	  delimiter: ','
});
const fileSuffix = options.a ? '_all' : '';

parser.on('readable', () => {
	let record;

	while (record = parser.read()) {
		if (record.length) {
			const mentor = record[0];
			const mentees = record.slice(1).filter(mentee => !!mentee);
			const existingMentees = personMap[mentor];

			if (existingMentees) {
				personMap[mentor] = existingMentees.concat(mentees);
			}
			else {
				personMap[mentor] = [...mentees];
			}
		}
		else {
			throw `NULL MENTOR. Record: ${record}`
		}
	}
});

parser.on('end', () => {
	const personIdMap = {};
	const fileName = `mohs${fileSuffix}`;
	const sb = new StringBuilder();
	let id = 0;
	let mohsId;
	let uniquePeople;

	fs.writeFile(`out/${fileName}.json`, JSON.stringify(personMap, null, '\t'), () => {})

	sb.appendLine(
`digraph "mohs" {
	graph [
		charset = "UTF-8";
		label = "Mohs Micrographic Surgery Family Tree",
		labelloc = "t",
		labeljust = "c",
		bgcolor = white
		fontcolor = "black",
		fontsize = 36,
		style = "filled",
		rankdir = LR,
		margin = 0.2,
		splines = spline,
		ranksep = 0.7,
		nodesep = 0.1
	];

	node [
		colorscheme = "rdylgn11"
		style = "solid,filled",
		fontsize = 8,
		fontcolor = "#ffeb85",
		fontname = "Migu 1M",
		color = 7,
		fillcolor = 11,
		fixedsize = true,
		height = .4,
		width = 1.2
	];

	edge [
		style = solid,
		fontsize = 14,
		fontcolor = white,
		fontname = "Migu 1M",
		color = black,
		labelfloat = true,
		labeldistance = 2.5,
		labelangle = 70
	];`);

	if (options.a) {
		const uniquePersonMap = {};
		Object.entries(personMap).forEach(([mentor, mentees]) => {
			uniquePersonMap[mentor] = true;
			mentees.forEach(mentee => {
				uniquePersonMap[mentee] = true;
			});
		});
		uniquePeople = Object.keys(uniquePersonMap);
	}
	else {
		// Only care about mentors.
		uniquePeople = Object.keys(personMap);
	}

	uniquePeople.forEach(name => {
		const personId = `person${id++}`;

		if (!mohsId && name === 'Frederic Mohs') {
			mohsId = personId;
		}

		personIdMap[name] = personId;
		sb.appendLine(`	${personId} [label = "${name}"];`);
	});

	Object.entries(personMap).forEach(([mentor, mentees]) => {
		const validMentees = options.a ? mentees : mentees.filter(mentee => !!personMap[mentee]);

		validMentees.forEach(mentee => {
			sb.appendLine(`	${personIdMap[mentor]} -> ${personIdMap[mentee]};`);
		});
	});

	sb.appendLine('}');
	fs.writeFile(`out/${fileName}.dot`, sb.toString(), () => { })
});

fs.readFile('./data/Mohs.csv', 'utf8', (err, data) => {
	if (err) {
		console.error(err);
	}
	else {
		parser.write(data);
	}

	parser.end();
});
