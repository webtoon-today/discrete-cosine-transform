const fs = require('fs');
const {Base} = require('./index');

const generate_sub_basis = (basis) => {
    return Array(Math.floor(basis)).fill(null).map((_,i) => basis/(i+1));
}

const generate_shorter_common_multiple = (base = 7, max=144) => {
    let ret = [];
    for (let i = base; i < max; i += base) {
        ret.push(i);
    }

    return ret;
}

const generate_2_4_multiple = (max) => {
    return [max * 4];
}

const unique = (val, idx, arr) => arr.indexOf(val) === idx;

const dots = JSON.parse(fs.readFileSync('./sample/data.json', 'utf8'));

const data = dots.map((dot, i) => [i, dot]);

//let base = Base.from_wavelengthes([296, 112, 14, 7, 7/2, 2])
let base = Base.from_wavelengthes([
    ...generate_sub_basis(7),
    ...generate_shorter_common_multiple(7, data.length),
    ...generate_2_4_multiple(data.length)
].filter(unique))

base.fit(data, 4, 3, 4000)

let start_from = 3, gap = 7, further = 50, tail = 35, ignorable = [];
let followed = base.follow({start_from, gap, further, tail, max_slit: 4, step: 2, dropout: 5000, ignorable})

fs.writeFileSync('./sample/expectation.tsv',
    data.map(([x, y]) => [x, y, Math.floor(base.get(x)), Math.floor(followed[x])].join('\t')).concat(
    new Array(further).fill(null).map((_,i) => [data[data.length - 1][0]+i+1, 0, 0, Math.floor(followed[data[data.length - 1][0]+i+1])].join('\t'))
).join('\n'))