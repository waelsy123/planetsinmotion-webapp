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

function betaFunc(beta_i, ry_cosy, Rs, Rp) {
    const alpha = getAlpha(Rs, Rp, beta_i);
    const projectedStar = Rs * cos(alpha);
    const argument = (projectedStar - ry_cosy) / Rp;
    return beta_i - acos(argument)
}

/**
 * Solves for the angle beta using a numerical method.
 *
 * @param {number} dy - Distance between the two bodies on the y-axis
 * @param {number} dz - Distance between the two bodies on the z-axis
 * @param {number} Rs - Radius of the star.
 * @param {number} Rp - Radius of the planet.
 * @param {number} [errTol=0.001] - Error tolerance for the solution.
 * @returns {Array} - The solved angle beta for each input.
 */
export function solveBeta(dy, dz, Rs, Rp, errTol = 0.001){
        let betaA = 0;
        let betaB = Math.PI;
        const phi = atan(dz / dy);
        // when deltay is close to 0 we get 0 = 0 in one of the equations, so best to use the vertical component of the equation
        const dy_cosphi = dy > 1e-3 ? dy / cos(phi) : dz / sin(phi)
        
        let betaC = (betaA + betaB) / 2

        let fC = betaFunc(betaC, dy_cosphi, Rs, Rp)
        // Check if the function is discontinuous at the midpoint
        if (isNaN(fC)) {
            // if so redefine the initial guess for betaA
            betaA = findInitBeta(betaC, dy_cosphi, Rs, Rp)
        }
        
        let err = (betaB - betaA) / 2;
        let fA = betaFunc(betaA, dy_cosphi, Rs, Rp);

        while ((err > errTol) && (fC !== 0)) {
            betaC = (betaA + betaB) / 2;
            fC = betaFunc(betaC, dy_cosphi, Rs, Rp);
            if (fC * fA < 0) {
                betaB = betaC;
            } else {
                betaA = betaC;
                fA = fC;
            }
            err = (betaB - betaA) / 2;
        }
        return (betaA + betaB) / 2;
    }

/**
* Find initial guess value for beta when the function _betafunc is discontinuous.
*/
function findInitBeta(init_beta, ry_cosphi, Rs, Rp) {
    
    let beta_a = init_beta
    let f_a = betaFunc(beta_a, ry_cosphi, Rs, Rp)
    while (isNaN(f_a)) {
        beta_a += 0.01
        f_a = betaFunc(beta_a, ry_cosphi, Rs, Rp)
    }
    return beta_a
}

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
