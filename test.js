const fs = require('fs');
const {Base} = require('./index');

const dots = JSON.parse(fs.readFileSync('./sample/data.json', 'utf8'));

const data = dots.map((dot, i) => [i, dot]);

//let base = Base.from_wavelengthes([296, 112, 14, 7, 7/2, 2])
let base = Base.from_wavelengthes([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,28,35,42,49,56,63,70,77,84,91,98,105,112,119,126,133,140,147,154,161,168,336])

base.fit(data, 10, 2, 50000)

console.log(base.asObject().map(basis => basis.wavelength))

fs.writeFileSync('./sample/expectation.tsv', data.map(([x, y]) => [x, y, base.get(x)].join('\t')).join('\n'))