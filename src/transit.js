import { getTransitArea} from './trigonometry.js'
import { Body } from './body.js';


export class Transit {
    /**
     * Parameters
     * ----------
     * @param {Body} eclipsedBody - The body being eclipsed
     * @param {Body} eclipsingBody - The eclipsing body
     * @param {boolean} checkFront - Whether to also check for the eclipsing body being in front of the eclipsed body
     */
    constructor(eclipsedBody, eclipsingBody, checkFront=true) {

        this.eclipsedBody = eclipsedBody;
        this.eclipsingBody = eclipsingBody;
        this.checkFront = checkFront;
        this.datapoints = eclipsingBody.rx.length;
        this.workoutTransits()

    }

    workoutTransits() {
        const [fullTransitIndexes, partialTransitIndexes ] = this.getTransits(this.eclipsingBody, this.eclipsedBody, this.checkFront);
        this.eclipsedArea = this.getEclipsedArea(fullTransitIndexes, partialTransitIndexes)
        this.visibleFraction = this.eclipsedArea.map(area => 1 - area / this.eclipsedBody.Area)

        this.transitDuration = partialTransitIndexes.length + fullTransitIndexes.length;

        this.transitDepth = Math.max(...this.eclipsedArea) / this.eclipsedBody.Area;
        
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
    getEclipsedArea(fullTransitIndexes, partialTransitIndexes) {
        
        var eclipsedArea = new Array(this.datapoints).fill(1);
        partialTransitIndexes.forEach(index => {

                eclipsedArea[index] = getTransitArea(this.eclipsedBody, this.eclipsingBody, index);
        });

        fullTransitIndexes.forEach(index => {
            // Set transit area for full transits
            eclipsedArea[index] = this.eclipsingBody.Area; // Full transit area is the area of the planet
            
        });
        return eclipsedArea
    }
    /**
     * Parameters
     * ----------
     * @param {Body} body - The eclipsing body (e.g. planet)
     * 
     * Returns
     * -------
     * Array of indices, the first index is the indexes where full transit occurs, the second where partial transit occurs
     * 
    */
    getTransits(body, star, checkInFront = true) {

         // Array of all indices
        const indices = Array.from({ length: this.datapoints }, (_, i) => i);

        const inFrontIndices = indices.filter(i => body.rx[i] > star.rx[i] || !checkInFront);

        const fullTransitIndices = inFrontIndices.filter(i => star.getProjectedDistance(body, i) + body._R <= star._R);

        const partialTransitIndices = inFrontIndices.filter(i =>
            (star.getProjectedDistance(body, i) - body._R < star._R) &&
            (star.getProjectedDistance(body, i) + body._R > star._R)
        );
        return [fullTransitIndices, partialTransitIndices];
    }


}