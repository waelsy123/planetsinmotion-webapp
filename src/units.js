import {R_sun, M_sun, M_J, R_J, R_earth, M_earth} from './constants.js'

export const units = ["jupyter", "solar", "earth"];

export class Units {
    constructor(units="jupyter"){

        if (units.indexOf(units) === -1) {
            throw new Error(`Invalid units: ${units}. Valid units are: ${units.join(', ')}`);
        }
        
        if (units === "solar") {
            this.R = R_sun;
            this.M = M_sun;
            this.symbol = "<sub>☉</sub>";
        } else if (units === "earth") {
            this.R = R_earth;
            this.M = M_earth;
            this.symbol = "<sub>⊕</sub>";
        } else if (units === "jupyter") {
            this.R = R_J;
            this.M = M_J;
            this.symbol = "<sub>J</sub>";
        }
    }
}