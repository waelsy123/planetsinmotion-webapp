import { getSemiMajorAxis, trueAnomaly, meanAnomaly, solveEccentricAnomaly, getRadialDistance } from './orbits.js';
import { pi, sin, cos, sqrt } from 'mathjs';
import {R_sun, M_sun, DaysToSeconds, AU} from './constants.js'
import {Body} from './body.js'
import {darkenColor} from './utils.js'

export class Planet extends Body{
    /**
     * Parameters
     * ----------
     * @param {number} i - Inclination of the orbit, 0 indicating the planet orbits coplanar to the stellar ecliptic. Default: 0
     * @param {number} omega0 - Argument of periapsis. Phase at which the planet is farthest from the star. Default: 0
     * @param {number} Omega0 - Longitude of the ascending node. Default: pi/2
     * @param {number} phase - Inital orbital phase
     * @param {Star} star - Host star body
     * @param {string} color - Color of the planet
     */
    constructor(M, R, P, star, i=0, e=0., omega0=0, Omega0=pi/2, phase0=0, color='blue', planetName="Planet 1") {
        super(M * M_sun, R * R_sun, color);
        this.checkInputParams(M, R, P, i, e, omega0, Omega0, star);
        this._e = e;
        this._Ms = star.M
        this._Rs = star.R
        this.i = i;
        this._P = P * DaysToSeconds;
        this.omega0 = omega0;
        this.Omega0 = Omega0;
        this.phase0 = phase0;
        this.color = color
        this.planetName = planetName
        this._a = getSemiMajorAxis(star.M, this._M, this._P)
        this._b = this._a * sqrt(1 - this._e**2);
        
        this._rmax = this.a * (1. + this.e);
        this.rmin = this.a * (1. - this._e)
        console.log(`Planet max distance: ${(this.rmax / AU).toFixed(2)} AU`);
    }
    get phase0() {
        return this.phase0
    }

    get rmax() {
        return this._rmax
    }

    set planetName(planetName) {
        this._planetName = planetName
    }

    get planetName() {
        return this._planetName
    }

    set R(newRadius) {
        const newR = newRadius * R_sun
        // Check if the planet is too close to the star
        if ((this.rmin - newR) < this._Rs) {
            throw new StarPlanetDistanceError(this.rmin, this._Rs)
        } else {
            this._R = newR; // Update the radius (convert to meters)
        }

    }
    set phase0(phase0){
        return this._phase0 = phase0
    }
    get phase0(){
        return this._phase0
    }

    /**
     * @param {number} newMs
     */
    set Ms(newMs) {
        const a = getSemiMajorAxis(newMs, this._M, this._P)
        const rmin = a * (1 - this._e);
        if ((rmin - this._R) < this._Rs) {
            throw new StarPlanetDistanceError(rmin, this._Rs)
        } else {
            this._Ms = newMs
            this._a = a
            this._b = this._a * sqrt(1 - this._e**2);
            this._rmin = rmin
            this._rmax = this._a * (1 + this._e);
        }
    }

    /**
     * @param {number} newRs
     */
    set Rs(newRs) {
        if ((this.rmin - this._R) < newRs) {
            throw new StarPlanetDistanceError(this.rmin, newRs)
        } else {
            this._Rs = newRs
        }
    }


    set e(newe) {
        const rmin = this._a * (1 - newe);
        if ((rmin - this._R) < this._Rs) {
            throw new StarPlanetDistanceError(rmin, this._Rs)
        } else {
            this._e = newe
            this.rmin = rmin
            this._rmax =  this._a * (1 + this._e);
            this._b = this._a * sqrt(1 - this._e**2);
        }
    }

    set M(newMass) {
        const newM = newMass * M_sun;

        const a = getSemiMajorAxis(this._Ms, newM, this._P);

        const rmin = a * (1 - this._e);

        if ((rmin - this._R) < this._Rs) {
            throw new StarPlanetDistanceError(rmin, this._Rs)
        } else {
            this._M = newM
            this._a = a
            this._b = this._a * sqrt(1 - this._e**2);
            this.rmin = rmin
            this._rmax =  a * (1 + this._e);
        }
    }


    set P(newPeriod) { 
        const newP = newPeriod * DaysToSeconds;
        const a = getSemiMajorAxis(this._Ms, this._M, newP);

        const rmin = a * (1 - this._e);

        if ((rmin - this._R) < this._Rs) {
            throw new StarPlanetDistanceError(rmin, this._Rs)
        } else {
            this._P = newP;
            this._a = a;
            this._b = this._a * sqrt(1 - this._e**2);
            this.rmin = rmin
            this._rmax =  a * (1 + this._e);
            
        }
    }

    get R() {
        return super.R / R_sun
    }

    get M() {
        return super.M / M_sun
    }

    get e() {
        return this._e
    }

    get a() {
        return this._a
    }

    get b() {
        return this._b
    }

    set i(i) {
        this._i = i / 180. * Math.PI
    }
    get i() {
        return this._i  / Math.PI * 180
    }

    get P() {
        return this._P / DaysToSeconds
    }


    toString(){
        return `Planet: ${(this.R).toFixed(1)} $R_\Earth$ \n ${(this.M).toFixed(1)} g \n i: ${(this.i).toFixed(0)} deg`;
    }
    equals(other){
        return this.R === other.R && this.M === other.M && this.i === other.i && this.e === other.e && this.P === other.P;
    }

    checkInputParams(M, R, P, i, e, omega0, Omega0, star){

        if (M * M_sun > star.M) {
            throw new PlanetDimensionsError(`Planet cannot be heavier than host star!`);
        }

        if (R * R_sun > star.R) {
            throw new PlanetDimensionsError(`Planet cannot be larger than host star!`);
        }

        if (!(-90<=i && i<=90)) {
            throw new Error(`Inclination ${i.toFixed(1)} must be between -90 and 90!`);
        }
        if (!(0<=omega0 && omega0<=pi)) {
            throw new Error(`Argument of periastron ${omega0.toFixed(1)} must be between 0 and pi!`);
        }
        if (!(0<=Omega0 && Omega0<=2*pi)) {
            throw new Error(`Longitude of the ascending ${Omega0} has to be between 0 and 2*pi!`);
        }
        if (!(0<=e && e <=1)) {
            throw new Error(`Eccentricity ${e} needs to be between 0 and 1!`);
        }

        const a = getSemiMajorAxis(star.M, M * M_sun, P * DaysToSeconds)
        const rmin = a * (1 - e)
        if ((rmin - R * R_sun) < star.R) {
            throw new StarPlanetDistanceError(rmin, star.R)
        }
    }
        /**
     * Parameters
     * ----------
     * @param {Star} star - Star object
     */ 
    setStar(star) {

        this.Ms = star.M
        this.Rs = star.R

    }
    
    setOrbitingTimes(times){
        /**
         * Parameters
         * ----------
         * @param {Array} times - Times
         */
        const M = meanAnomaly(times, 2 * pi / this._P, 0);

        const E = M.map(M_i => solveEccentricAnomaly(M_i, this._e));
        
        const nu = trueAnomaly(this._e, E, this.phase0)
        
        const r = getRadialDistance(this._a, this._e, nu);
        
        const sinnu = nu.map((nu_i) => sin(nu_i + this.omega0));
        const cosnu = nu.map((nu_i) => cos(nu_i + this.omega0));
        const cosOmega = cos(this.Omega0); // Omega0 is constant
        const sinOmega = sin(this.Omega0); // Omega0 is constant
        const cosi = cos(this._i); // i is constant
        const sini = sin(this._i); // i is constant

        this.rx = r.map((r_i, index) => r_i * (cosOmega * cosnu[index] * cosi - sinOmega * sinnu[index])); // line of sight direction
        this.ry = r.map((r_i, index) => r_i * (sinOmega * cosnu[index] * cosi + cosOmega * sinnu[index]));
        this.rz = r.map((r_i, index) => -r_i * cosnu[index] * sini);
    }

    draw(context, center, scale, i, faceon=true) {
        context.save()
        context.globalAlpha = 1

        const x = this.ry[i] * scale
        var y = scale;
        var z  = scale
        if (faceon) {
            y *= this.rx[i]
            z *= this.rz[i]
        } else {
            y *= this.rz[i]
            z *= -this.rx[i]
        }

        const planetX = center[0] + x
        const planetY = center[1] + y
        const theta = Math.atan2(y, x)
        const r = Math.sqrt(x**2 + y**2 + z**2)
        const phi = Math.acos(Math.sqrt(x**2 + y**2) / r)
        const startangle =  ((theta + 3 * Math.PI / 2) + Math.sign(z) * phi)
        const endangle = ((theta + Math.PI / 2) - Math.sign(z) * phi)

        /// Shadow part
        // Apply the shadow gradient
        context.fillStyle = darkenColor(this.color, 50)

        context.beginPath();
        context.arc(planetX, 
            planetY, this._R * scale, endangle, startangle, true);
        context.fill();
        context.closePath();

        ///Bright part
        context.restore()
        context.fillStyle = this.color
        //context.globalAlpha = 1
        context.beginPath();
        context.arc(planetX, 
            planetY, this._R * scale, 
           endangle, startangle, false);
    
        context.fill();
        context.closePath();
        context.restore()
        
    }

    
}

export class StarPlanetDistanceError extends Error {
    constructor(rmin, Rs) {
        const message = `Star-planet distance ${(rmin/AU).toFixed(2)} AU is below stellar radius ${(Rs/AU).toFixed(2)} AU!`
        super(message); // Call the parent class constructor with the error message
        this.name = "StarPlanetDistanceError"; // Set the error name
        this.rmin = rmin; // Minimum distance between the star and the planet
        this._Rs = Rs; // Stellar radius
    }

}

export class PlanetDimensionsError extends Error {
    constructor(message) {
        super(message);
    }
}