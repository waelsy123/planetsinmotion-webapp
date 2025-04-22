import {sqrt} from 'mathjs';
import {getBeta, getAlpha, transitArea} from './trigonometry.js'


export class Body{
    /**
     * Parameters
     * ----------
     * @param {number} M - Mass of the host star
     * @param {number} R - Radius of the star in solar units
     * @param {string} color - Color of the planet
     */
    constructor(M, R, color='yellow') {
        this._M = M;
        this._R = R;
        this.rx = [];
        this.ry = [];
        this.rz = [];
        this.color = color
    }

    get Area() {
        return Math.PI * this._R**2;
    }


    get M () {
        return this._M
    }

    get R() {
        return this._R
    }

        /**
     * Initializes the position arrays (rx, ry, rz) based on the input times.
     * For a static body (e.g., a star), these arrays are filled with zeros.
     *
     * @param {number[]} times - Array of time points.
     */
    setOrbitingTimes(times) {
        this.rx = new Array(times.length).fill(0);
        this.ry = new Array(times.length).fill(0);
        this.rz = new Array(times.length).fill(0);
    }


        /**
         * Parameters
         * ----------
         * @param {number} Ro - Radius of the object being eclipsed (e.g. host star)
         * @param {number|Array} ry - y position of the object being transited
         * @param {number|Array} rz - z position of the object being transited
         */
    getFullTransits(body) {
        const proj_distance = this.getProjectedDistance(body.ry, body.rz)
        return proj_distance.map((dist, index) => (dist + this._R <= body._R) && (this.rx[index] > body.rx[index] ));
    }

    getPartialTransits(body){
        /**
         * Parameters
         * ----------
         * @param {number} Ro - Radius of the object being eclipsed (e.g. host star)
         */
        const proj_distance = this.getProjectedDistance(body.ry, body.rz)
        const partialtransit = proj_distance.map((dist, index) => ( ( (dist - this._R < body._R) && (dist + this._R > body._R) )  && (this.rx[index] > body.rx[index]) ));
        return partialtransit;
        }

    /**
     * Calculates the projected distance between two points in a 2D plane.
     *
     * @param {number|number[]} ry - The y-coordinate(s) of the first point(s). Can be a single number or an array of numbers.
     * @param {number|number[]} rz - The z-coordinate(s) of the second point(s). Can be a single number or an array of numbers.
     * @throws {Error} Throws an error if `ry` and `rz` are not both arrays or both single values.
     * @returns {number|number[]} The projected distance(s) between the points. Returns a single number if `ry` and `rz` are numbers, 
     * or an array of distances if they are arrays.
     */
    getProjectedDistance(ry, rz) {

        if ((Array.isArray(ry) && !Array.isArray(rz)) || (Array.isArray(rz) && !Array.isArray(ry))) {
            throw Error("Both ry and rz must be arrays");
        } else if (Array.isArray(ry) && Array.isArray(rz)) {
            if ((ry.length !== rz.length) || (ry.length !== this.ry.length)) {
                throw Error("ry and rz must have the same length");
            }
        }

        let projected_distance;
        
        if (Array.isArray(rz)) {
            projected_distance = this.ry.map((ry_i, index) => 
                sqrt((ry_i - ry[index]) ** 2 + (this.rz[index] - rz[index]) ** 2));
        } else {
            projected_distance = this.ry.map((ry_i, index) => 
                sqrt((ry_i - ry) ** 2 + (this.rz[index] - rz) ** 2));
        }

        return projected_distance   
    }


    /**
     * Calculates the area eclipsed by this body on the input body (e.g., a star).
     *
     * @param {Body} body - The body being eclipsed (e.g., the star).
     * @returns {number[]} An array representing the eclipsed area at each data point.
     *
     * Notes:
     * - The method calculates the eclipsed area based on the relative positions and radii of the two bodies.
     * - It distinguishes between full transits (where the entire planet is within the star's disk) and partial transits.
     * - The calculation uses the angles `alpha` (angle between the centers of the two bodies) and `beta` (angle between the center of the planet and the edge of the star).
     */
    getEclipsedArea(body) {
        const datapoints = this.rx.length
        var A = new Array(datapoints).fill(0);
    
        const ry = body.ry;
        const rz = body.rz;
        const partialtransitArray = this.getPartialTransits(body); 
        partialtransitArray.forEach((transit, index) => {
            if (transit) {
                const beta = getBeta(body._R, this._R, this.ry[index], this.rz[index], ry[index], rz[index])
                const alpha = getAlpha(body._R, this._R, beta)
                A[index] += transitArea(body._R, this._R, beta, alpha);
            }

        });

        const fullTransitArray = this.getFullTransits(body)

            // Set transit area for full transits
            fullTransitArray.forEach((isTransit, index) => {
            if (isTransit) {
                A[index] += this.Area; // Full transit area is the area of the planet
            }
        });

        return A
    
        }
    
}