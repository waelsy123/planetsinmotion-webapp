import { Planet, StarPlanetDistanceError } from './planet.js';


const addPlanetBtn = document.getElementById("add-planet-btn");


export class PlanetMenu {
    constructor(onUpdate, star) {
        this.onUpdate = onUpdate; // Callback to restart the simulation

        // Initialize menu elements
        this.createPlanets(star);

        this.defaultColor = document.getElementById("planet-period").style.color
    }

    createPlanets(star) {
        const periodInput = document.getElementById("planet-period")
        const radiusInput = document.getElementById("planet-radius")
        const iInput = document.getElementById("inclination")
        const eInput = document.getElementById("eccentricity")
        const colorInput = document.getElementById("planet-color")

        const nplanets = 1
        const masses = [2, 4]
        const periodmultiple = [1, 4]
        var planets = new Array(nplanets)
        for (let i=0; i< nplanets; i++) {
            const planet = this.createPlanet(masses[i], radiusInput.value, periodmultiple[i] * periodInput.value, 
                star, parseFloat(eInput.value), parseFloat(iInput.value), colorInput.value);
            /* do not add wrong planets */
            if (!planet) {
                continue
            } else {
                planets[i] = planet
            }
        }
        /* No planets */
        if (!planets[0]) {  
            console.error("Error creating planet. Check parameters.");
            this.planets = []
            return;
        } else {
                        
            this.maxDistance = Math.max(...planets.map((planet) => planet.rmax));
            this.planets = planets

        }

        radiusInput.addEventListener("input", (event) => {
            const R = parseFloat(event.target.value);
            try { 
                this.planets[0].R = R;
                event.target.style.color = this.defaultColor
                this.onUpdate(); // Trigger simulation update
            } catch (error) {
                if (error instanceof StarPlanetDistanceError) {
                    event.target.style.color = "red"
                    console.error(`Star-Planet Distance Error: ${error.message}`);
                }
            }
        });

        colorInput.addEventListener("input", (event) => {
            const color = event.target.value
            this.planets[0].color = color
        })

        periodInput.addEventListener("input", (event) => {
            const min = parseFloat(event.target.min);
            var value = parseFloat(event.target.value);
                    
            if (value < min) {
                value = min; // Reset to minimum
                event.target.value = value
            }
            try { 
                this.planets[0].P = value;
                event.target.style.color = this.defaultColor
                /* TODO: trigger lightcurve to recalculate times */
                this.maxDistance = Math.max(...planets.map((planet) => planet.rmax));
                this.onUpdate(); // Trigger simulation update
                
            }  catch (error) {
                if (error instanceof StarPlanetDistanceError) {
                    event.target.style.color = "red"
                    console.error(`Star-Planet Distance Error: ${error.message}`);
                } else {
                    console.error(`Unexpected error: ${error.message}`);
                }
            }
        });

        eInput.addEventListener("input", (event) => {
            const min = parseFloat(event.target.min);
            const max = parseFloat(event.target.max);
            var value = parseFloat(event.target.value);
        
            if (value < min) {
                value = min; // Reset to minimum
                event.target.value = value
            } else if (value > max) {
                value = max; // Reset to maximum
                event.target.value = value
            }
            try {
                this.planets[0].e = value;
                event.target.style.color = this.defaultColor
                this.maxDistance = Math.max(...planets.map((planet) => planet.rmax));
                this.onUpdate(); // Trigger simulation update
            } catch (error) {
                if (error instanceof StarPlanetDistanceError) {
                    event.target.style.color = "red"
                    console.error(`Star-Planet Distance Error: ${error.message}`);
                } else {
                    console.error(`Unexpected error: ${error.message}`);
                }
            }
        });


        iInput.addEventListener("input", (event) => {
            const min = parseFloat(event.target.min);
            const max = parseFloat(event.target.max);
            var value = parseFloat(event.target.value);
        
            if (value < min) {
                value = min; // Reset to minimum
                event.target.value = value
            } else if (value > max) {
                value = max; // Reset to maximum
                event.target.value = value
            }
                this.planets[0].i = value /* conversion happens inisde */
                this.maxDistance = Math.max(...planets.map((planet) => planet.rmax));
                this.onUpdate(); // Trigger simulation update
        });
    }

    setTimes(times) {
            this.planets.forEach((planet) => {
                planet.setOrbitingTimes(times);
            });
    }

    createPlanet(Mp, Rp, P, star, e, i, color) {
        const Ms = star.M;
        const Rs = star.R;
        try {
        return new Planet(Mp, Rp, P, Ms, 
            Rs, i, e, 0, 0, 0, color);
        } catch (error) {
            if (error instanceof StarPlanetDistanceError) {
                console.error(`Star-Planet Distance Error: ${error.message}`);
                return
            } else {
                console.error(`Unexpected error: ${error.message}`);
                return
            }
        }
    }
}
