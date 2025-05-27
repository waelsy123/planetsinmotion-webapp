import { pi, sqrt, sin, cos, tan, atan } from 'mathjs';
import { Gcgs, AU } from './constants';
/**
 * Computes the true anomaly.
 *
 * @param {number} e - Eccentricity.
 * @param {number} E - Mean anomaly.
 * @returns {number} - The true anomaly in radians.
 */
export function trueAnomaly(e, E, phase0 = 0) {
    return E.map((E_i) => ( (2 * atan(sqrt((1 + e) / (1 - e)) * tan(E_i / 2))) % (2 * pi)) + 2 * pi * phase0);
}

/**
 * Computes the mean anomaly.
 *
 * @param {Array|number} times - Array of times or a single time value.
 * @param {number} omega - The mean angular velocity (2π/P).
 * @param {number} t0 - Time of periastron.
 * @returns {Array|number} - The mean anomaly.
 */
export function meanAnomaly(times, omega, t0) {
    return times.map((t) => (omega * (t - t0)) % (2 * pi));
}

/**
 * Kepler's Equation relating the eccentric anomaly and the eccentricity to the mean anomaly.
 *
 * @param {number|Array} E - Eccentric anomaly (array-like or float).
 * @param {number|Array} M - Mean anomaly (array-like or float).
 * @param {number} e - Eccentricity.
 * @returns {number|Array} - The result of Kepler's equation.
 */
export function keplerEquation(E, M, e) {

    if (Array.isArray(E) && Array.isArray(M)) {
        if (E.length !== M.length) {
            throw new Error("E and M arrays must have the same length");
        }
        return E.map((E_i, index) => E_i - (M[index] + e * sin(E_i)));
    } else if (!Array.isArray(E) && !Array.isArray(M)) {
        return E - (M + e * sin(E));
    } else {
        throw new Error("E and M must be both arrays or both single values");
    }
}

/**
 * Solves Kepler's Equation for the eccentric anomaly.
 *
 * @param {number} M - Mean anomaly.
 * @param {number} e - Eccentricity.
 * @param {number} [err_tol=0.001] - Error tolerance for the solution.
 * @param {number} [max_N=100] - Maximum number of iterations.
 * @returns {number} - The eccentric anomaly that solves Kepler's Equation.
 */
export function solveEccentricAnomaly(M, e, err_tol = 0.001, max_N = 100) {
    let a = 0;
    let b = 2 * pi;
    let err = (b - a) / 2;
    let f_a = keplerEquation(a, M, e);

    for (let i = 0; i < max_N; i++) {
        const c = (a + b) / 2;
        const f_c = keplerEquation(c, M, e);

        if (f_c * f_a < 0) {
            b = c;
        } else {
            a = c;
            f_a = f_c;
        }

        err = (b - a) / 2;
        if (err < err_tol || f_c === 0) {
            return c;
        }
    }
    return null; // Return null if no solution is found
}

/**
 * Kepler's Law to calculate the semi-major axis of the orbit.
 *
 * @param {number} M1 - Stellar mass in grams.
 * @param {number} M2 - Planet mass in grams.
 * @param {number} P - Period of the planet in seconds.
 * @returns {number} - The semi-major axis of the orbit.
 */
export function getSemiMajorAxis(M1, M2, P) {
    const a = (P ** 2 * Gcgs * (M1 + M2) / (4 * pi ** 2)) ** (1 / 3);
    return a;
}
/**
 * Inverted Kepler's Law to calculate the period of the orbit from the semi-major axis.
 * 
 * @param {number} M1 
 * @param {number} M2 
 * @param {number} a 
 * @returns 
 */
export function getPeriod(M1, M2, a) {
    return 2 * pi * (a ** 3 / (Gcgs * (M1 + M2))) ** (0.5);
}

/**
 * Computes the radial distance as a function of the true anomaly.
 *
 * @param {number|Array} a - Semi-major axis (float or array-like).
 * @param {number} e - Eccentricity.
 * @param {number|Array} nu - The true anomaly (float or array-like).
 * @returns {number|Array} - The radial distance from the focal point (float or array-like).
 */
export function getRadialDistance(a, e, nu) {
    return nu.map((nu_i) => a * (1 - e ** 2) / (1 + e * cos(nu_i)));
}