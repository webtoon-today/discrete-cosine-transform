"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.min_higher = exports.max_lower = exports._n = exports.arccos = exports.PI = void 0;
exports.PI = Math.PI;
const arccos = (num) => {
    return Math.acos(num);
};
exports.arccos = arccos;
/** @description normalize into [0 ~ 2PI]. */
const _n = (num) => {
    return ((num % exports.PI) + exports.PI) % exports.PI;
};
exports._n = _n;
const max_lower = (num_list, criteria) => {
    let ret = num_list[0];
    for (let num of num_list) {
        if (ret < num && num < criteria) {
            ret = num;
        }
    }
    return ret;
};
exports.max_lower = max_lower;
const min_higher = (num_list, criteria) => {
    let ret = num_list[0];
    for (let num of num_list) {
        if (ret > num && num > criteria) {
            ret = num;
        }
    }
    return ret;
};
exports.min_higher = min_higher;
