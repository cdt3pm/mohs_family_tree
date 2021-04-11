const parse = require('csv-parse');
const fs = require('fs');

const personMap = {};
const suffixes = [];
const parser = parse({
	  delimiter: ','
});
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
	const uniquePeople = {};
	const personIdMap = {};
	let id = 0;

	console.log(`
digraph "mohs" {
	graph [
		charset = "UTF-8";
		label = "Mohs Family Tree",
		labelloc = "t",
		labeljust = "c",
		bgcolor = white
		fontcolor = blue,
		fontsize = 18,
		style = "filled",
		rankdir = LR,
		margin = 0.2,
		splines = spline,
		ranksep = 0.8,
		nodesep = 0.1
	];

	node [
		colorscheme = "rdylgn11"
		style = "solid,filled",
		fontsize = 16,
		fontcolor = blue,
		fontname = "Migu 1M",
		color = lightgray,
		fillcolor = lightgray,
		fixedsize = true,
		height = 0.6,
		width = 2.5
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

	// One node for each mentor
	Object.keys(personMap).forEach(name => {
		const personId = `person${id++}`;
		personIdMap[name] = personId;
		console.log(`	${personId} [label = "${name}"];`);
	});

	Object.entries(personMap).forEach(([mentor, mentees]) => {
		mentees
			// Make sure mentee is also a mentor
			.filter(mentee => !!personMap[mentee])
			.forEach(mentee => {
				console.log(`	${personIdMap[mentor]} -> ${personIdMap[mentee]};`);
			});
	});

	console.log('}');
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
