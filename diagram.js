const parse = require('csv-parse');
const fs = require('fs');
const getopts = require('getopts');
const StringBuilder = require('string-builder');

const options = getopts(process.argv.slice(2), {
  alias: { all: 'a', config: 'c' }
});
const personMap = {};
const parser = parse({
	  delimiter: ','
});
const config = options.config || 'dot';
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

	sb.appendLine('digraph "mohs" {');
	const configFile = `./config/${config}`;
	fs.readFile(configFile, 'utf8', (_, data) => {
		sb.appendLine(data);

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

		console.log(`Total unique ${options.all ? 'people' : 'mentors'}: ${Object.keys(uniquePeople).length}`);

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
		fs.writeFile(`out/${fileName}_${config}.dot`, sb.toString(), () => { })
	});
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
