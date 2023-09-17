const fs = require('fs');
const {Base} = require('./index');
const {PI} = require('./util');

const dots = JSON.parse(fs.readFileSync('./data2.json', 'utf8'));

const data = dots.map((dot, i) => [i, dot]);

//let base = Base.from_wavelengthes([296, 112, 14, 7, 7/2, 2])
let base = Base.from_wavelengthes([7])

base.fit(data)

console.log(JSON.stringify(base.asObject(),undefined,2))

fs.writeFileSync('expectation.tsv', data.map(([x, y]) => [x, y, ...base.getAll(x), base.getAll(x).reduce( (a,b) => a+b, 0 )].join('\t')).join('\n'))