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
			const mentors = [record[0]];

			record.slice(1)
				.filter(mentee => !!mentee)
				.forEach(mentee => {
					const existingMentors = personMap[mentee];

					if (existingMentors) {
						personMap[mentee] = existingMentors.concat(mentors);
					}
					else {
						personMap[mentee] = [...mentors];
					}
				});
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

	console.log('graph "mohs" {');

	Object.entries(personMap).forEach(([mentee, mentors]) => {
		mentors.forEach(mentor => {
			uniquePeople[mentor] = true;
		});

		uniquePeople[mentee] = true;
	});

	Object.keys(uniquePeople).forEach(name => {
		const personId = `person${id++}`;
		personIdMap[name] = personId;
		console.log(`${personId} [label = "${name}"];`);
	});

	Object.entries(personMap).forEach(([mentee, mentors]) => {
		mentors.forEach(mentor => {
			console.log(`${personIdMap[mentor]} -> ${personIdMap[mentee]};`);
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
