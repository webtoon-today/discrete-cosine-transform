export type radian = number & {_radianBrand: never};

export const PI = Math.PI as radian;

export const arccos = (num: number): radian => {
    return Math.acos(num) as radian;
}

/** @description normalize into [0 ~ 2PI]. */
export const _n = (num: radian): radian => {
    return ((num % PI) + PI) % PI as radian;
}

export const max_lower = (num_list: number[], criteria: number) => {
    let ret = num_list[0]

    for (let num of num_list){
        if (ret < num && num < criteria){
            ret = num;
        }
    }

    return ret;
}
export const min_higher = (num_list: number[], criteria: number) => {
    let ret = num_list[0]

    for (let num of num_list){
        if (ret > num && num > criteria){
            ret = num;
        }
    }

    return ret;
}

