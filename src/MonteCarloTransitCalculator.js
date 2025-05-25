
export class MonteCarloTransitCalculator {
    /**
     * @param {Star} star 
     * @param {number} numSamples 
     */
    constructor(star, numSamples){
        this.star = star;
        this.numSamples = numSamples;
    }

    set star(star) {
        this._star = star;
        this.drawPoints(this.numSamples);
    }
    
    set numSamples(numSamples) {
        this._numSamples = numSamples;
        this.drawPoints(numSamples);

    }

    get star(){
        return this._star;
    }
    get numSamples() {  
        return this._numSamples;
    }

    drawPoints(numSamples) {
        const r = Array.from({ length: numSamples }, () => Math.sqrt(Math.random()) * this.star._R);
        const theta = Array.from({ length: numSamples }, () => Math.random() * 2 * Math.PI);
        this.ypoints = r.map((rVal, i) => rVal * Math.cos(theta[i]));
        this.zpoints = r.map((rVal, i) => rVal * Math.sin(theta[i]));
    }

    filterByEclipses(planets) {
        const eclipsingPlanets = new Set();
        const eclipsingTimes = new Set();
        for (let t = 0; t < planets[0].rx.length; t++) {
            planets.forEach(planet => {
                const dist = this.star.getProjectedDistance(planet, t);
                if (((dist - planet._R) <= this.star._R) && (planet.rx[t] > this.star.rx[t])) {
                        eclipsingTimes.add(t);
                        eclipsingPlanets.add(planet);
                }
            });
        }
        return [eclipsingPlanets, eclipsingTimes];
    }

    getEclipsedFraction(planets) {
        const [eclipsingPlanets, eclipsingTimes] = this.filterByEclipses(planets);
        let fraction = new Float64Array(this.star.rz.length).fill(1);
        eclipsingTimes.forEach(t => {
            let coveredPoints = 0;
            for (let i = 0; i < this.numSamples; i++) {
                for (let k = 0; k < eclipsingPlanets.size; k++) {
                    const planet = planets[k];
                    if (planet.rx[t] > this.star.rx[t]){
                        if ((this.ypoints[i] - planet.ry[t]) ** 2 + (this.zpoints[i] - planet.rz[t]) ** 2 < planet._R ** 2) {
                            coveredPoints += 1;
                            break;
                        }
                }
                }
            }
            // Store the fraction at the end of each time t
            fraction[t] = 1 - coveredPoints / this.numSamples;

        });
        return fraction;
    }


    /**
     * Numerically calculates the observable area of the star when multiple bodies past across it.
     * @param {Array} planets 
     * @param {number} numSamples 
     * @returns 
     */
    getEclipsingAreasMonteCarloFast_unused(planets, numSamples = 10000) {
        const datapoints = this.rx.length;
        let fraction = new Float64Array(datapoints).fill(1);
        const [eclipsingPlanets, eclipsingTimes] = this.filterByEclipsesSet(planets);
        const r = Array.from({ length: numSamples }, () => Math.sqrt(Math.random()) * this._R);
        const theta = Array.from({ length: numSamples }, () => Math.random() * 2 * Math.PI);
        const y = r.map((rVal, i) => rVal * Math.cos(theta[i]));
        const z = r.map((rVal, i) => rVal * Math.sin(theta[i]));

        eclipsingTimes.forEach(t => {
            let remainingIndexes = Array.from({ length: numSamples }, (_, i) => i);
            eclipsingPlanets.forEach(planet => {
                // Filter remaining indexes based on whether the points are eclipsed
                remainingIndexes = remainingIndexes.filter(index => {
                    const distanceSquared = (y[index] - planet.ry[t]) ** 2 + (z[index] - planet.rz[t]) ** 2;
                    return distanceSquared >= planet._R ** 2; // Keep points that are not eclipsed
                });
            });
            const coveredPoints = numSamples - remainingIndexes.length;
            fraction[t] = 1 - coveredPoints / numSamples;

        });
        return fraction;
    }
    

}