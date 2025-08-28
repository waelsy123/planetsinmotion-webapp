import { getBeta, circle_circle_circle_area, getDistance } from "./trigonometry.js";
import { Transit } from "./transit.js";

export class DoubleTransit {
    /**
 * Parameters
 * ----------
 * @param {Body} eclipsedBody - The body being eclipsed
 * @param {Body} eclipsingBody1 - The eclipsing body
 * @param {Body} eclipsingBody2 - The eclipsing body
 */
    constructor(eclipsedBody, eclipsingBody1, eclipsingBody2) {
        // Ensure eclipsingBody1 is the larger-radius planet
        if (eclipsingBody1._R < eclipsingBody2._R) {
            // Swap the bodies if eclipsingBody2 has a larger radius
            [eclipsingBody1, eclipsingBody2] = [eclipsingBody2, eclipsingBody1];
        }

        this.eclipsingBody1 = eclipsingBody1;
        this.eclipsingBody2 = eclipsingBody2;
        this.eclipsedBody = eclipsedBody;
        this.eclipsingBody1 = eclipsingBody1;
        this.eclipsingBody2 = eclipsingBody2;
        this.datapoints = eclipsingBody1.rx.length;

        if (this.datapoints != eclipsingBody2.rx.length) {
            throw new Error("Eclipsing bodies must have the same number of data points");
        }

        this.planet1StarTransit = new Transit(eclipsedBody, eclipsingBody1);
        this.planet2StarTransit = new Transit(eclipsedBody, eclipsingBody2);
        this.planetPlanetTransit = new Transit(eclipsingBody1, eclipsingBody2, false);

        this.workoutTransits();

    }


    workoutTransits() {
        // assume both areas and correct for the small planet transit during simultaneous transits
        this.eclipsedArea = this.planet1StarTransit.eclipsedArea.map((area, index) => area + this.planet2StarTransit.eclipsedArea[index] );

        // indexes where both planets undergo a full transit simultaneously
        const fullFullTransitIndexes = this.planet1StarTransit.fullTransitIndexes.filter(item => this.planet2StarTransit.fullTransitIndexes.includes(item));
        fullFullTransitIndexes.forEach(index => {
            // full full full
            if (this.planetPlanetTransit.fullTransitIndexes.includes(index)) {
                console.log("Full - Full - Full", index);
                // subtract the area of the small planet as it is fully inside the big planet
                this.eclipsedArea[index] -= this.eclipsingBody2.Area;
                // full full partial
            } else if (this.planetPlanetTransit.partialTransitIndexes.includes(index)) {
                console.log("Full - Full - Partial", index);
                // remove the area shared by the two planets
                this.eclipsedArea[index] -= this.planetPlanetTransit.eclipsedArea[index];

            };

        });

        const partialFullTransitIndexes = this.planet1StarTransit.partialTransitIndexes.filter(item => this.planet2StarTransit.fullTransitIndexes.includes(item));
        partialFullTransitIndexes.forEach(index => {
            // partial full full
            if (this.planetPlanetTransit.fullTransitIndexes.includes(index)) {
                console.log("Partial - Full - Full", index);
                // subtract the area of the small planet as it is fully inside the big planet
                this.eclipsedArea[index] -= this.eclipsingBody2.Area;
                // full full partial
            } else if (this.planetPlanetTransit.partialTransitIndexes.includes(index)) {
                console.log("Partial - Full - Partial", index);
                // remove the area shared by the two planets
                this.eclipsedArea[index] -= this.planetPlanetTransit.eclipsedArea[index];

            };

        });

        const fullPartialTransitIndexes = this.planet1StarTransit.fullTransitIndexes.filter(item => this.planet2StarTransit.partialTransitIndexes.includes(item));
        fullPartialTransitIndexes.forEach(index => {
            // full partial full
            if (this.planetPlanetTransit.fullTransitIndexes.includes(index)) {
                console.log("Full - Partial - Full", index);
                // subtract the area of the small planet as it is fully inside the big planet
                throw new Error("Full Partial Full transit should not exist!");
                // full partial partial
            } else if (this.planetPlanetTransit.partialTransitIndexes.includes(index)) {
                console.log("Full - Partial - Partial", index);
                // remove the area shared by the two planets
                this.eclipsedArea[index] -= this.planetPlanetTransit.eclipsedArea[index];

            };

        });

        const partialPartialTransitIndexes = this.planet1StarTransit.partialTransitIndexes.filter(item => this.planet2StarTransit.partialTransitIndexes.includes(item));
        partialPartialTransitIndexes.forEach(index => {
            // full partial full
            if (this.planetPlanetTransit.fullTransitIndexes.includes(index)) {
                console.log("Partial - Partial - Full", index);
                // subtract the area shared by the small planet and the star
                this.eclipsedArea[index] -= this.planet2StarTransit.eclipsedArea[index];
                // full partial partial
            } else if (this.planetPlanetTransit.partialTransitIndexes.includes(index)) {
                // remove the area shared by the two planets
                const [point_up, point_down] = this.planetPlanetTransit.getContactPoints(index);
                const dpoint_up = getDistance(point_up, [this.eclipsedBody.ry[index], this.eclipsedBody.rz[index]])
                const dpoint_down = getDistance(point_down, [this.eclipsedBody.ry[index], this.eclipsedBody.rz[index]])
                    // if both contact points are inside the star, then this is like a Planet - Planet - Partial (case 2)
                    if ((dpoint_down < this.eclipsedBody._R) && (dpoint_up < this.eclipsedBody._R)) {
                        this.eclipsedArea[index] -= this.planetPlanetTransit.eclipsedArea[index];
                        console.log("Partial - Partial - Partial (case 2)", index);
                    } else {
                        // If the closest point contact point is outside the star, this is not a true triple transit and the planets
                        // do not share any area ON the star (case 3), so we can skip this index unless it is INSIDE the star
                        if (Math.min(dpoint_down, dpoint_up) < this.eclipsedBody._R) {
                            
                            // Determine the point with the smallest distance to the star's center
                            const point1 = dpoint_up < dpoint_down ? point_up : point_down;
                            // get contact points between the first planet and the star
                            const point2 = this.selectContactPoint(this.planet1StarTransit, this.eclipsingBody2, index);
                            const point3 = this.selectContactPoint(this.planet2StarTransit, this.eclipsingBody1, index);
                            const sharedArea = circle_circle_circle_area(this.eclipsedBody._R, this.eclipsingBody2._R, this.eclipsingBody1._R, point1, point2, point3);
                            console.log("Partial - Partial - Partial (case 1): sharedArea", (sharedArea /this.eclipsedBody.Area).toFixed(2), "index", index);
                            this.eclipsedArea[index] -= sharedArea;
                        } else {
                            console.log("Partial - Partial - Partial (case 3)", index);
                        }

                    }
            };

        });

        this.visibleFraction = this.eclipsedArea.map(area => 1 - area / this.eclipsedBody.Area)

        this.transitDepth = Math.max(...this.eclipsedArea) / this.eclipsedBody.Area;

    }
    /**
     * Returns the contact point of the transit closest to the non-participating body's center.
     * @param {Transit} transit 
     * @param {Body} body - Body not participating in the transit, used to get the contact points
     * @param {number} index - Index of the transit to select contact points for
     * @returns {Tuple} - a contact point closest to the non-participating body's center
     */
    selectContactPoint(transit, body, index) {
        const [point_up, point_down] = transit.getContactPoints(index);
        const dpoint_up = getDistance(point_up, [body.ry[index], body.rz[index]])
        const dpoint_down = getDistance(point_down, [body.ry[index], body.rz[index]])
        const point = dpoint_up < dpoint_down ? point_up : point_down;
        return point;
    }

}