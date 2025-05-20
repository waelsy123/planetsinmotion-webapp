import { combinations, sqrt } from 'mathjs';
import { getBeta, getAlpha, transitArea } from './trigonometry.js'
import { linspace } from './utils.js';


export class Body {
    /**
     * Parameters
     * ----------
     * @param {number} M - Mass of the host star
     * @param {number} R - Radius of the star in solar units
     * @param {string} color - Color of the planet
     */
    constructor(M, R, color = 'yellow') {
        this._M = M;
        this._R = R;
        this.rx = [];
        this.ry = [];
        this.rz = [];
        this.color = color
    }

    get Area() {
        return Math.PI * this._R ** 2;
    }


    get M() {
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
     * @param {Body} body - The eclipsing body (e.g. planet)
    */
    getTransits(body, checkInFront = true) {

        const datapoints = this.rx.length
        var fullTransitArray = new Array(datapoints).fill(false);
        var partialTransitArray = new Array(datapoints).fill(false);

        for (let i = 0; i < datapoints; i++) {
            if (this.rx[i] > body.rx[i] || !checkInFront) {

                const projectedDistance = this.getProjectedDistance(body, i);
                // Full transit
                if (projectedDistance + this._R <= body._R) {
                    fullTransitArray[i] = true;
                    // Partial transit  
                } else if ((projectedDistance - this._R < body._R) && (projectedDistance + this._R > body._R)) {
                    partialTransitArray[i] = true;
                }
            }
        }
        return [fullTransitArray, partialTransitArray];
    }
    /**
     * Parameters
     * ----------
     * @param {Body} body - The body being eclipsed (e.g. the star)
     */
    getFullTransits(body) {
        const datapoints = this.rx.length
        var fullTransits = new Array(datapoints).fill(false);
        for (let i = 0; i < datapoints; i++) {
            if (this.rx[i] > body.rx[i]) {
                const projectedDistance = this.getProjectedDistance(body, i);
                // Full transit
                if (projectedDistance + this._R <= body._R) {
                    transits[i] = true;
                }
            }

            return fullTransits
        }
    }

    /**
     * Parameters
     * ----------
     * @param {Body} body - The transiting body (e.g. planet)
     */
    getPartialTransits(body) {
        const datapoints = this.rx.length
        var partialTransits = new Array(datapoints).fill(false);
        for (let i = 0; i < datapoints; i++) {
            if (this.rx[i] > body.rx[i]) {
                const projectedDistance = this.getProjectedDistance(body, i);
                //Partial transit
                partialTransits[i] = (dist - this._R < body._R) && (dist + this._R > body._R)
            }
        }
        return partialTransits;
    }

    getProjectedDistance(body, i) {
        const projectedDistance = sqrt((body.ry[i] - this.ry[i]) ** 2 + (body.rz[i] - this.rz[i]) ** 2);
        return projectedDistance;
    }
    /**
     * Calculates the area eclipsed by this body on the input body (e.g., a star).
     *
     * @param {Body} body - The body being eclipsed (e.g., the star).
     *
     * Notes:
     * - The method calculates the eclipsed area based on the relative positions and radii of the two bodies.
     * - It distinguishes between full transits (where the entire planet is within the star's disk) and partial transits.
     * - The calculation uses the angles `alpha` (angle between the centers of the two bodies) and `beta` (angle between the center of the planet and the edge of the star).
     */
    getEclipsedArea(body) {
        const datapoints = this.rx.length
        var A = new Array(datapoints).fill(0);
        const { fullTransit, partialTransit } = this.getTransits(body);
        partialTransit.forEach((partialTransitItem, index) => {

            if (partialTransitItem) {
                const beta = getBeta(body._R, this._R, this.ry[index], this.rz[index], body.ry[index], body.rz[index]);
                const alpha = getAlpha(body._R, this._R, beta);
                A[index] += transitArea(body._R, this._R, beta, alpha);
                // Set transit area for full transits
            } else if (fullTransit[index]) {
                A[index] += this.Area; // Full transit area is the area of the planet
            }

        });
        return A

    }

    draw(context, center, scale, i, faceon = true) {
        context.save()
        context.fillStyle = this.color;
        context.beginPath();
        const x = this.ry[i] * scale;
        var y = scale;
        if (faceon) {
            y *= this.rx[i];
        } else {
            y *= this.rz[i];
        }

        const bodyX = center[0] + x;
        const bodyY = center[1] + y;
        context.arc(bodyX, bodyY, this._R * scale, 0, 2 * Math.PI);

        context.fill();
        context.closePath();
        // Create a radial gradient for the shadow
        const gradient = context.createRadialGradient(
            bodyX, bodyY, 0, // Inner circle (center of the planet)
            bodyX, bodyY, this._R * scale // Outer circle (edge of the planet)
        );
        gradient.addColorStop(0, "rgba(0, 0, 0, 0.01)"); // Lighter shadow at the center
        gradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");   // Darker shadow at the edges

        // Apply the shadow gradient
        context.fillStyle = gradient;
        context.globalCompositeOperation = "multiply"; // Blend the shadow with the planet's color
        context.beginPath();
        context.arc(bodyX, bodyY, this._R * scale, 0, 2 * Math.PI);
        context.fill();
        context.closePath();
        context.restore()

    }



    /**
     * Calculates the fraction of the star's area eclipsed by a set of planets over time.
     * 
     * This method computes the eclipsing areas caused by planets transiting in front of a star.
     * It accounts for full and partial transits, as well as overlapping eclipses between planets.
     * 
     * @param {Array<Object>} planets - An array of planet objects. Each planet object must have the following methods:
     *   - `getEclipsedArea(star)`: Returns an array representing the area eclipsed by the planet at each time step.
     *   - `getFullTransits(otherPlanets)`: Returns an array of booleans indicating whether the planet is in full transit with respect to other planets.
     *   - `getPartialTransits(otherPlanet)`: Returns an array of booleans indicating whether the planet is in partial transit with respect to another planet.
     *   - `Area`: The area of the planet.
     *   - `_R`: The radius of the planet.
     *   - `ry` and `rz`: Arrays representing the y and z coordinates of the planet's position over time.
     * 
     * @returns {Array<number>} An array representing the fraction of the star's area that is not eclipsed at each time step.
     * Each value is calculated as `1 - (eclipsed area / total star area)`.
     */
    getEclipsingAreas(planets) {
        const datapoints = this.rx.length;
        var previousPlanets = new Array(planets.length)
        var A = new Array(datapoints).fill(0);

        /*Sort planets by size, biggest first*/
        const sortedPlanets = planets.slice().sort((a, b) => b.R - a.R);

        sortedPlanets.forEach((planet, planetIndex) => {
            /* Get eclipses due to this planet*/
            const [fullTransits, partialTransits] = planet.getTransits(this);
            partialTransits.forEach((partialTransitItem, index) => {

                if (partialTransitItem) {
                    const beta = getBeta(this._R, planet._R, planet.ry[index], planet.rz[index], this.ry[index],
                        this.rz[index]);
                    const alpha = getAlpha(this._R, planet._R, beta);
                    A[index] += transitArea(this._R, planet._R, beta, alpha);
                    // Set transit area for full transits
                } else if (fullTransits[index]) {
                    A[index] += planet.Area; // Full transit area is the area of the planet
                }

            });

            /* Get eclipses due to other planets and subtract them */
            previousPlanets.forEach((prevPlanet) => {
                console.log("Iterating previous planets", prevPlanet.planetName)
                // for the transits between planets, we do no care whether which one is in front of each other
                const [fullTransitPlanet, partialTransitPlanet] = planet.getTransits(prevPlanet, false);
                console.log("Full transit planet", fullTransitPlanet);
                console.log("Partial transit planet", partialTransitPlanet);
                const [fullTransitPrevPlanet, partialTransitPrevPlanet] = prevPlanet.getTransits(this);
                // There are 8 combinations of transits, but one cannot exist as the previous planet is always larger
                fullTransitPlanet.forEach((fullTransit, index) => {
                    // if there is a full transit of the two planets, check if it occurred while the other planet was transiting
                    if (fullTransit) {
                        prevPlanetTransits = fullTransitPrevPlanet[index] || partialTransitPrevPlanet[index];
                        //while the other is also transiting we subtrated the total area of the planet if the other is in partial or full
                        // full/partial - full - full
                        if (fullTransits[index] && prevPlanetTransits) {
                            console.log("Full - Full - Full");
                            A[index] -= planet.Area; // Full transit area is the area of the planet
                            // partial - partial - full (full - partial - full cannot exist as the prev is always larger)
                        } else if (partialTransits[index] && partialTransitPrevPlanet[index]) {
                            console.log("partial - partial - full");
                            const beta = getBeta(prevPlanet._R, planet._R, planet.ry[index], planet.rz[index], prevPlanet.ry[index], prevPlanet.rz[index])
                            const alpha = getAlpha(prevPlanet._R, planet._R, beta);
                            A[index] -= transitArea(prevPlanet._R, planet._R, beta, alpha);
                        }
                        // partial transit between the two planets
                    } else if (partialTransitPlanet[index]) {
                        console.log("Partial transit between the two planets");
                        const thisplanetTransits = fullTransits[index] || partialTransits[index];
                        // if the big planet is in full transit and the small planet is in partial or full transit, we remove shared areas
                        // full - partial/full - partial or partial - full - partial
                        if ((fullTransitPrevPlanet[index] && thisplanetTransits) || (partialTransitPrevPlanet[index] && fullTransits[index])) {
                            console.log("Full/Partial - Partial/Full - Partial", index);
                            const beta = getBeta(prevPlanet._R, planet._R, planet.ry[index], planet.rz[index], prevPlanet.ry[index], prevPlanet.rz[index])
                            const alpha = getAlpha(prevPlanet._R, planet._R, beta);
                            console.log("Transit area", transitArea(prevPlanet._R, planet._R, beta, alpha) / this.Area);
                            A[index] -= transitArea(prevPlanet._R, planet._R, beta, alpha);
                            // partial - partial - partial
                        } else if (partialTransitPrevPlanet[index] && partialTransits[index]) {
                            console.log("To be implemented", index);
                            //removeSharedAreas();
                            A[index] = 1; // Full transit area is the area of the planet
                        }

                    }

                });
            });
            /*Append planet to the previous planets*/
            previousPlanets[planetIndex] = planet;
        });
        const fraction = A.map((area) => 1 - area / this.Area);
        console.log("fraction", fraction);
        return fraction
    }
    /**
     * Get the largeest coordinate of the body, useful for screen sizing
     * @returns {number} - The maximum coordinate of the body
     */
    maxCoordinate() {
        const maxRx = Math.max(...this.rx.map(Math.abs));
        const maxRy = Math.max(...this.ry.map(Math.abs));
        const maxRz = Math.max(...this.rz.map(Math.abs));
        return Math.max(maxRx, maxRy, maxRz);
    }

    /**
     * Numerically calculates the observable area of the star when multiple bodies past across it.
     * @param {Array} planets 
     * @param {number} segments 
     * @returns 
     */
    getEclipsingAreasNumerical(planets, rsegments = 500, thetasegments = 250) {

        const rArray = linspace(0, this._R, rsegments)
        const thetaArray = linspace(0, 2 * Math.PI, thetasegments)
        const datapoints = this.rx.length;
        let fraction = new Array(datapoints).fill(0);
        const dr = rArray[1] - rArray[0];
        const dtheta = thetaArray[1] - thetaArray[0];

        for (let t = 0; t < datapoints; t++) {
            // With these we keep track of which star areas are still not covered
            let rArrayCurrent = rArray.slice();
            let thetaArrayCurrent = thetaArray.slice();
            planets.forEach(planet => {
                console.log("Iterating planets", planet.planetName)
                // see if the planet is in front of the star and covering it
                if (planet.rx[t] > this.rx[t]) {
                    const proj_distance = sqrt((this.ry[t] - planet.ry[t]) ** 2 + (this.rz[t] - planet.rz[t] ** 2))
                    // Check if the planet is covering the star
                    if (proj_distance - planet._R < this._R) {
                        console.log("Planet covers the star at time", t)
                        let newRArray = [];
                        let newThetaArray = [];

                        rArrayCurrent.forEach(r => {
                            //dA depends on r
                            const dA = (dr * dtheta * r);
                            let keepR = false;
                            thetaArrayCurrent.forEach(theta => {
                                const dy = r * Math.cos(theta);
                                const dz = r * Math.sin(theta);
                                const distance = sqrt((dy - planet.ry[t]) ** 2 + (dz - planet.rz[t]) ** 2);
                                if (distance < planet._R) {
                                    fraction[t] += dA;
                                } else {
                                    // If one theta is NOT covered, we keep this r
                                    keepR = true;
                                    newThetaArray.push(theta);
                                }
                            });

                            if (keepR) {
                                newRArray.push(r)
                            }

                        });

                        rArrayCurrent = newRArray;
                        thetaArrayCurrent = newThetaArray;
                    }


                }
            });
            // Store the fraction at the end of each time t
            fraction[t] = 1 - fraction[t] / this.Area;

        }
        //const fraction = coveredArea.map((area) => 1 - area / this.Area);
        console.log("fraction", fraction);
        return fraction;
        for (let i = 0; i < segments; i++) {
            const dy = this._R * Math.cos(i * 2 * Math.PI / segments);
            for (let j = 0; j < segments; j++) {
                const dz = this._R * Math.sin(j * 2 * Math.PI / segments);
                for (let k = 0; k < planets.length; k++) {
                    const planet = planets[k];
                    if (planet.rx[t] > this.rx[t]) {
                        if ((planet.ry[t] + planet._R > dy) && (planet.ry[t] - planet._R < dy) && (planet.rz[t] + planet._R > dz) && (planet.rz[t] - planet._R < dz)) {
                            coveredArea[t] = dA;
                            // if only one planet already covers this datapoint, we no need to explore the rest
                            break;
                        }
                    }
                }
            }
        }


    }



    /**
     * Numerically calculates the observable area of the star when multiple bodies past across it.
     * @param {Array} planets 
     * @param {number} segments 
     * @returns 
     */
    getEclipsingAreasMonteCarlo(planets, numSamples = 100000) {
        const datapoints = this.rx.length;
        let fraction = new Array(datapoints).fill(0);
        let coveredArea = 0;
        const dr = this._R / numSamples;
        const dtheta = 2 * Math.PI / numSamples;
        for (let t = 0; t < datapoints; t++) {
            coveredArea = 0;
            for (let i = 0; i < numSamples; i++) {
                const r = Math.random() * this._R;
                const theta = Math.random() * 2 * Math.PI;
                const dy = r * Math.cos(theta);
                const dz = r * Math.sin(theta);
                for (let k = 0; k < planets.length; k++) {
                    const planet = planets[k];
                    const distance = sqrt((dy - planet.ry[t]) ** 2 + (dz - planet.rz[t]) ** 2);
                    if ((distance < planet._R) && (planet.rx[t] > this.rx[t])) {
                        coveredArea += dr * dtheta * r;
                        break;
                    }
                }
            }
            // Store the fraction at the end of each time t
            fraction[t] = 1 - coveredArea / this.Area;

        }
        return fraction;
    }

}