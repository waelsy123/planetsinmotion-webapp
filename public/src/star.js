import {R_sun, M_sun} from './constants.js'
import {Body} from './body.js'

export class Star extends Body {
    /**
     * Parameters
     * ----------
     * @param {number} M - Mass of the host star in solar units
     * @param {number} R - Radius of the star in solar units
     * @param {string} color - Color of the star
     */
    constructor(M, R, color='yellow') {
        super(M * M_sun, R * R_sun, color);
    }

    set M(newM){
        this._M = newM * M_sun
    }
    set R(newR) {
        this._R = newR * R_sun
    }


    get R() {
        return super.R
    }

    get M() {
        return super.M
    }

    toString(){
        return `Star: ${(this.R / R_sun).toFixed(1)} $R_\odot$ \n ${(this.M / M_sun).toFixed(1)} g`;
    }
    equals(other){
        return this.R === other.R && this.M === other.M;
    }
    
}