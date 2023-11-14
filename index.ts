import {PI, _n, arccos, radian} from './util';

const generate_sub_basis = (basis:number) => {
    return Array(Math.floor(basis)).fill(null).map((_,i) => basis/(i+1));
}

const generate_shorter_common_multiple = (base = 7, max=144) => {
    let ret = [];
    for (let i = base; i < max; i += base) {
        ret.push(i);
    }

    return ret;
}

const generate_2_4_multiple = (max:number) => {
    return [max * 2, max * 4];
}

const unique = (val:any, idx:number, arr:any[]) => arr.indexOf(val) === idx;

const regulate = (val: number, min: number, max: number) => {
    if (val < min){
        return min - (min - val) / (max - min) * min;
    }else {
        return val;
    }
}

export class OutOfAmplitudeRangeException extends Error {
    constructor () {
        super();
        this.name = "out of amplitude range";
        this.message = "out of amplitude range";
    }
    
};

export class Basis {

    /** @description the amplitude of sine function. ( M ) */
    private amplitude: number;
    
    /** @description the initial phase of sine function in radian scale. ( \a_0 ) */
    private phase_init: radian;
    /** @description the length of one vibrate cycle in radian scale. ( \lambda ) wavelength = 1 / (angular velocity) */
    private wavelength: radian;

    constructor ( 
        phase_init = 0 as radian, amplitude:number = 1, wavelength = PI * 2 as radian
    ) {
        this.phase_init = phase_init;
        this.amplitude = amplitude;
        this.wavelength = wavelength;
    }

    public set =  ({
        phase_init, amplitude, wavelength
    }: {
        phase_init?:radian, amplitude?:number, wavelength?: radian, data?: [radian, number][]
    }) => {
        if (phase_init !== undefined) { this.phase_init = phase_init; };
        if (amplitude  !== undefined) { this.amplitude = amplitude };
        if (wavelength !== undefined) { this.wavelength = wavelength };
    }

    public asObject = () => {
        return {
            phase_init: this.phase_init,
            amplitude: this.amplitude,
            wavelength: this.wavelength
        };
    }

    /**
     * 
     * @description Compute the the \theta when the function magnitude is y.
     * @param {number} y the magnitude of function, it should be in range [- M + \a_0, M + \a_0]
     * @throws {OutOfAmplitudeRangeException}
     * @returns {radian[]} a list of radian numbers of phase that have magnitude y.
     */
    public rev = (y: number):radian[] => {

        if ( y > this.amplitude
          || y < 0 - this.amplitude) {
            throw new OutOfAmplitudeRangeException();
        }

        let candis: radian[] = [];
        let ret = arccos( y / this.amplitude );
        for (let phase = ret ; phase < PI * 2; phase = phase + this.wavelength as radian ) {
            candis.push( _n(     ret            - this.phase_init as radian) );
            if (ret === 0 || ret === PI) { continue };
            candis.push( _n( _n(-ret as radian) - this.phase_init as radian) );
        }

        return candis;
    }

    public get = (theta: radian):number => { 
        return this.amplitude * Math.cos(this.phase_init + 2 * PI * theta / this.wavelength);
    }

    /** @description 실제 측정 샘플 [x, y][]와 base를 통해 예측값 사이의 MSE를 구합니다. */
    public calc_mse = (samples: [radian, number][] ) => {
        if (samples.length === 0){
            return 0;
        }

        let errors = samples.map(([x, y]) => 
            [y, this.get(x)]
        ).map(([real, expectation]) => (real - expectation) * (real - expectation) )
        
        return errors.reduce( (lhs, rhs) => lhs + rhs, 0 ) / errors.length;
    }

    public fit = (options: {
        samples: [radian, number][], max_slit:number, max_amplitude:number, step:number
    }|[radian, number][], ...others: any) => {
        if (Array.isArray(options) ) {
            return this._fit(options, ...others);
        }else {
            return this._fit(options.samples, options.max_slit, options.max_amplitude, options.step);
        }
    }

    private _fit = (samples: [radian, number][], max_slit = 4, max_amplitude=1.0, step=10) => {
        
        let [min_mse_value, min_mse_amptd, min_mse_phase] = [-1, 0, 0 as radian];
    
        const [phase_global_max, phase_global_min] = [2 * PI as radian, 0 as radian];
        let   [phase_local_max,  phase_local_min ] = [phase_global_max, phase_global_min];
    
        const [amptd_global_max, amptd_global_min] = [max_amplitude, 0];
        let   [amptd_local_max,  amptd_local_min ] = [amptd_global_max, amptd_global_min];

        for (let i = 0; i< step; i ++) {
            for (let j = 0; j < max_slit; j += 1) {
                let phase_init = phase_local_min + (phase_local_max - phase_local_min) / max_slit * j as radian;
                
                this.set({phase_init})
    
                for (let k = 0; k < max_slit; k += 1) {
                    let amplitude = amptd_local_min + (amptd_local_max - amptd_local_min) / max_slit * k;
                    
                    this.set({amplitude})
    
                    const mse = this.calc_mse(samples);
                    if (min_mse_value < 0 || min_mse_value > mse){
                        min_mse_value = mse;
                        min_mse_phase = this.phase_init;
                        min_mse_amptd = this.amplitude;
                    }
                }
            }
    
            phase_local_max = Math.min(                  min_mse_phase + (phase_local_max - phase_local_min) / max_slit, phase_global_max) as radian;
            phase_local_min = Math.max(phase_global_min, min_mse_phase - (phase_local_max - phase_local_min) / max_slit) as radian;
    
            amptd_local_max = Math.min(                  min_mse_amptd + (amptd_local_max - amptd_local_min) / max_slit, amptd_global_max);
            amptd_local_min = Math.max(amptd_global_min, min_mse_amptd - (amptd_local_max - amptd_local_min) / max_slit);
        }
    
        this.set({amplitude: min_mse_amptd, phase_init: min_mse_phase});
    
        return this;
    }
}

export class Base {
    private base: Basis[];
    private offset: number;

    /** @description stored data to fit incrementally */
    private data: [radian, number][];

    constructor (base: [radian, number, radian][], offset = 0) {
        this.base = base.map(([phase_init, amplitude, wavelength]) => new Basis(phase_init, amplitude, wavelength));
        this.offset = offset;
        this.data = [];
    }

    public getAll = (theta: radian) => {
        return [this.offset, ...this.base.map( basis => basis.get(theta) )];
    }
    
    public get = (theta: radian) => {
        return this.getAll(theta).reduce( (a,b) => a+b, 0 );
    }


    /** @description 실제 측정 샘플 [x, y][]와 base를 통해 예측값 사이의 MSE를 구합니다. */
    public calc_mse = (samples: [radian, number][], ) => {
        if (samples.length === 0 || this.base.length === 0){
            return 0;
        }

        let errors = samples.map(([x, y]) => 
            [y, this.base.map( basis => basis.get(x) ).reduce((lhs, rhs) => lhs + rhs, 0)]
        ).map(([real, expectation]) => (real - expectation) * (real - expectation) )

        return errors.reduce( (lhs, rhs) => lhs + rhs, 0 ) / errors.length;
    }

    public fit = (options: {
        given_samples: [radian, number][], max_slit:number, step:number, dropout: number
    }|[radian, number][], ...others: any) => {
        if (Array.isArray(options) ) {
            return this._fit(options, ...others);
        }else {
            return this._fit(options.given_samples, options.max_slit, options.step, options.dropout);
        }
    }

    public _fit = (given_samples: [radian, number][], max_slit=4, step = 10, dropout = 0.0005) => {
        this.offset = given_samples.map(([x,y]) => y).reduce((a,b)=> a+b,0) / given_samples.length;

        let samples = given_samples.map(([x, y]) => ([x, y - this.offset] as [radian, number]));

        this.base.sort((BaseA, BaseB) => BaseB.asObject().wavelength - BaseA.asObject().wavelength).forEach( (basis) => {
            let max_amplitude = Math.max( ...samples.map(([x,y]) => Math.abs(y)) )

            basis.fit(samples, max_slit, max_amplitude, step);
            samples = samples.map(([x,y]) => ([x, y - basis.get(x)] as [radian, number]))
        } )

        this.base = this.base.filter(basis => basis.asObject().amplitude > dropout)

        this.data = [...given_samples];

        return this;
    }

    public follow = (
        {
            wavelengths: given_wavelengths=[], ignorable=[],
            start_from = 14, gap = 7, tail = 14, further = 28, max_slit = 4, step=10, dropout= -1
        }:{
            wavelengths: number[], ignorable: number[],
            start_from: number, gap: number, tail: number, further: number, max_slit: number, step: number, dropout: number
        }) => {
        let base = new Base([], 0);
        let ret: number[] = Array(start_from+gap).fill(0);
        
        for (let i = start_from; i < this.data.length; i++ ){
            const wavelengths = (given_wavelengths.length === 0
                ?[
                    ...generate_sub_basis(7),
                    ...generate_shorter_common_multiple(7, Math.min(i+1, tail)),
                    ...generate_2_4_multiple(Math.min(i+1, tail))
                ].filter(unique)
                :given_wavelengths
            ).map(wavelength => [0, 0, wavelength as radian] as [radian, number, radian]);
    
            base = new Base(wavelengths, 0);
            base.fit({given_samples: this.data.slice(Math.max(i+1 - tail,0),i+1).filter(([idx, val]) => !ignorable.includes(idx)), max_slit, step, dropout});

            let max = Math.max(...this.data.slice(Math.max(i+1 - tail,0),i+1).map(([_, num]) => num));
            let min = Math.min(...this.data.slice(Math.max(i+1 - tail,0),i+1).map(([_, num]) => num));
            ret.push(regulate(base.get(i + gap as radian), min, max));
        }

        for (let i = this.data.length; i < this.data.length + further; i++ ) {
            ret.push(base.get(i+gap as radian));
        }


        return ret;
    }

    public asObject = () => {
        return [{
            phase_init: 0 as radian, amplitude: this.offset, wavelength: Infinity as radian,
        }, ...this.base.map(basis => basis.asObject())];
    }

    static from_wavelengthes = (wavelenthes: radian[] = []) => {
        return new Base(wavelenthes.map(wavelength => [0 as radian, 0, wavelength]));
    }
}