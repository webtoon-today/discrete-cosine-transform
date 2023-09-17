"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Base = exports.Basis = exports.OutOfAmplitudeRangeException = void 0;
const util_1 = require("./util");
class OutOfAmplitudeRangeException extends Error {
    constructor() {
        super();
        this.name = "out of amplitude range";
        this.message = "out of amplitude range";
    }
}
exports.OutOfAmplitudeRangeException = OutOfAmplitudeRangeException;
;
class Basis {
    constructor(phase_init = 0, amplitude = 1, wavelength = util_1.PI * 2) {
        this.set = ({ phase_init, amplitude, wavelength }) => {
            if (phase_init !== undefined) {
                this.phase_init = phase_init;
            }
            ;
            if (amplitude !== undefined) {
                this.amplitude = amplitude;
            }
            ;
            if (wavelength !== undefined) {
                this.wavelength = wavelength;
            }
            ;
        };
        this.asObject = () => {
            return {
                phase_init: this.phase_init,
                amplitude: this.amplitude,
                wavelength: this.wavelength
            };
        };
        /**
         *
         * @description Compute the the \theta when the function magnitude is y.
         * @param {number} y the magnitude of function, it should be in range [- M + \a_0, M + \a_0]
         * @throws {OutOfAmplitudeRangeException}
         * @returns {radian[]} a list of radian numbers of phase that have magnitude y.
         */
        this.rev = (y) => {
            if (y > this.amplitude
                || y < 0 - this.amplitude) {
                throw new OutOfAmplitudeRangeException();
            }
            let candis = [];
            let ret = (0, util_1.arccos)(y / this.amplitude);
            for (let phase = ret; phase < util_1.PI * 2; phase = phase + this.wavelength) {
                candis.push((0, util_1._n)(ret - this.phase_init));
                if (ret === 0 || ret === util_1.PI) {
                    continue;
                }
                ;
                candis.push((0, util_1._n)((0, util_1._n)(-ret) - this.phase_init));
            }
            return candis;
        };
        this.get = (theta) => {
            return this.amplitude * Math.cos(this.phase_init + 2 * util_1.PI * theta / this.wavelength);
        };
        /** @description 실제 측정 샘플 [x, y][]와 base를 통해 예측값 사이의 MSE를 구합니다. */
        this.calc_mse = (samples) => {
            if (samples.length === 0) {
                return 0;
            }
            let errors = samples.map(([x, y]) => [y, this.get(x)]).map(([real, expectation]) => (real - expectation) * (real - expectation));
            return errors.reduce((lhs, rhs) => lhs + rhs, 0) / errors.length;
        };
        this.fit = (samples, max_slit = 4, max_amplitude = 1.0, step = 10) => {
            const points = samples.sort(([lx, ly], [rx, ry]) => rx - lx);
            let [min_mse_value, min_mse_amptd, min_mse_phase] = [-1, 0, 0];
            const [phase_global_max, phase_global_min] = [2 * util_1.PI, 0];
            let [phase_local_max, phase_local_min] = [phase_global_max, phase_global_min];
            const [amptd_global_max, amptd_global_min] = [2 * max_amplitude, 0];
            let [amptd_local_max, amptd_local_min] = [amptd_global_max, amptd_global_min];
            for (let i = 0; i < step; i++) {
                for (let phase_init = phase_local_min; phase_init < phase_local_max; phase_init = phase_init + (phase_local_max - phase_local_min) / max_slit) {
                    this.set({ phase_init });
                    for (let amplitude = amptd_local_min; amplitude < amptd_local_max; amplitude = amplitude + (amptd_local_max - amptd_local_min) / max_slit) {
                        this.set({ amplitude });
                        const mse = this.calc_mse(samples);
                        console.log(JSON.stringify({ phase_init, amplitude, mse }, undefined, 0));
                        if (min_mse_value < 0 || min_mse_value > mse) {
                            min_mse_value = mse;
                            min_mse_phase = this.phase_init;
                            min_mse_amptd = this.amplitude;
                        }
                    }
                }
                phase_local_max = Math.min(min_mse_phase + (phase_local_max - phase_local_min) / max_slit, phase_global_max);
                phase_local_min = Math.max(phase_global_min, min_mse_phase - (phase_local_max - phase_local_min) / max_slit);
                amptd_local_max = Math.min(min_mse_amptd + (amptd_local_max - amptd_local_min) / max_slit, amptd_global_max);
                amptd_local_min = Math.max(amptd_global_min, min_mse_amptd - (amptd_local_max - amptd_local_min) / max_slit);
            }
            this.set({ amplitude: min_mse_amptd, phase_init: min_mse_phase });
            return this;
        };
        this.phase_init = phase_init;
        this.amplitude = amplitude;
        this.wavelength = wavelength;
    }
}
exports.Basis = Basis;
class Base {
    constructor(base) {
        this.getAll = (theta) => {
            return [this.offset, ...this.base.map(basis => basis.get(theta))];
        };
        this.get = (theta) => {
            return this.getAll(theta).reduce((a, b) => a + b, 0);
        };
        /** @description 실제 측정 샘플 [x, y][]와 base를 통해 예측값 사이의 MSE를 구합니다. */
        this.calc_mse = (samples) => {
            if (samples.length === 0 || this.base.length === 0) {
                return 0;
            }
            let errors = samples.map(([x, y]) => [y, this.base.map(basis => basis.get(x)).reduce((lhs, rhs) => lhs + rhs, 0)]).map(([real, expectation]) => (real - expectation) * (real - expectation));
            return errors.reduce((lhs, rhs) => lhs + rhs, 0) / errors.length;
        };
        this.fit = (given_samples, max_slit = 4, step = 10) => {
            this.offset = given_samples.map(([x, y]) => y).reduce((a, b) => a + b, 0) / given_samples.length;
            let samples = given_samples.map(([x, y]) => [x, y - this.offset]);
            let max_amplitude = Math.max(...samples.map(([x, y]) => Math.abs(y)));
            this.base.forEach((basis) => {
                basis.fit(samples, max_slit, max_amplitude, step);
                samples = samples.map(([x, y]) => [x, y - basis.get(x)]);
                max_amplitude = Math.max(...samples.map(([x, y]) => Math.abs(y)));
            });
            return this;
        };
        this.asObject = () => {
            return [{
                    phase_init: 0, amplitude: this.offset, wavelength: Infinity,
                }, this.base.map(basis => basis.asObject())];
        };
        this.base = base.map(([phase_init, amplitude, wavelength]) => new Basis(phase_init, amplitude, wavelength));
        this.offset = 0;
    }
}
exports.Base = Base;
Base.from_wavelengthes = (wavelenthes = []) => {
    return new Base(wavelenthes.map(wavelength => [0, 0, wavelength]));
};
