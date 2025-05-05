import { sin, cos, asin, acos, atan } from 'mathjs';

/**
 * Computes the angle alpha.
 *
 * @param {number} Rs - Radius of the star or eclipsed object.
 * @param {number} Rp - Radius of the planet or transiting object.
 * @param {number} beta - Angle between the line connecting the two bodies' centers and the line connecting the eclipsed body's center and the point of contact.
 * @returns {number} - The angle alpha for each input.
 */
export function getAlpha(Rs, Rp, beta) {

    const alpha = asin((Rp * sin(Math.PI - beta)) / Rs);
    
    return alpha;
}

/**
 * Calculates the angle beta.
 *
 * @param {number} R0 - Radius of the main object.
 * @param {number} Rplanet - Radius of the eclipsing planet object with properties `ry`, `rz`, and `R`.
 * @param {number} ry - Array of positions in the y-axis.
 * @param {number} rz - Array of positions in the z-axis.
 * @returns {number} - The angle beta transit.
 */
export function getBeta(R0, Rplanet, planetry, planetrz, ry=0, rz=0) {

    const deltaY = Math.abs(planetry - ry)
    const deltaZ = planetrz - rz
    const beta = Math.PI - solveBeta(deltaY, deltaZ, R0, Rplanet);
    return beta;
};

function betaFunc(beta_i, ry, Rs, Rp, phi) {
    const alpha = getAlpha(Rs, Rp, beta_i);
    const projectedStar = Rs * cos(alpha);
    const argument = (projectedStar - ry / cos(phi)) / Rp;
    return beta_i - acos(argument)
}

/**
 * Solves for the angle beta using a numerical method.
 *
 * @param {Array} ry - Array of positions in the y-axis.
 * @param {Array} rz - Array of positions in the z-axis.
 * @param {number} Rs - Radius of the star.
 * @param {number} Rp - Radius of the planet.
 * @param {number} [errTol=0.001] - Error tolerance for the solution.
 * @returns {Array} - The solved angle beta for each input.
 */
export function solveBeta(ry, rz, Rs, Rp, errTol = 0.001){
        let betaA = 0;
        let betaB = Math.PI;
        let err = (betaB - betaA) / 2;
        const phi = atan(rz / ry);

        let fA = betaFunc(betaA, ry, Rs, Rp, phi);

        if (isNaN(fA)) {
            return NaN;
        }

        while (err > errTol) {
            const betaC = (betaA + betaB) / 2;
            const fC = betaFunc(betaC, ry, Rs, Rp, phi);
            if (fC * fA < 0) {
                betaB = betaC;
            } else {
                betaA = betaC;
                fA = fC;
            }
            err = (betaB - betaA) / 2;
        }
        return (betaA + betaB) / 2;
    };

/**
 * Computes the transit area.
 *
 * @param {number} Rs - Radii of the eclipsed body (e.g. the star).
 * @param {number} Rp - Radii of the eclipsing body (e.g. planet).
 * @param {number} beta - Array of angles beta.
 * @param {number} alpha - Array of angles alpha.
 * @returns {area} - The transit area.
 */
export function transitArea(Rs, Rp, beta, alpha){
    const area = Rp ** 2 * (beta - cos(beta) * sin(beta)) +
               Rs ** 2 * (alpha - cos(alpha) * sin(alpha));
    
    return area;
};
