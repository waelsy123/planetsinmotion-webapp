import {DaysToSeconds} from './constants.js'


const linspace = (start, stop, num) => {
    const step = (stop - start) / (num - 1);
    return Array.from({ length: num }, (_, i) => start + i * step);
};

export class LightcurveMenu {
    constructor(planets, onUpdate) {
        this.onUpdate = onUpdate; // Callback to restart the simulation

        // Initialize menu elements
        this.initLightcurve(planets);

        

    }


    initLightcurve(planets) {
        const datapointsInput = document.getElementById("datapoints");
        this.datapoints = parseInt(datapointsInput.value);

        const orbitsInput = document.getElementById("orbits");
        this.orbits = parseInt(orbitsInput.value);

        this.calculateTimes(planets);

        datapointsInput.addEventListener("input", (event) => {
            const min = parseFloat(event.target.min);
            if (event.target.value < min) {
                event.target.value = min; // Reset to minimum
            }
            this.datapoints = parseInt(event.target.value);

            this.onUpdate(); // Trigger simulation update
        });

        orbitsInput.addEventListener("input", (event) => {
            const min = parseFloat(event.target.min);
            if (event.target.value < min) {
                event.target.value = min; // Reset to minimum
            }

            this.orbits = parseInt(event.target.value);

            this.calculateTimes(planets);

            this.onUpdate(); // Trigger simulation update
        });

        // Add listener to the export button
        this.exportButton = document.getElementById("export-lightcurve");

    }

    calculateTimes(planets){
        const maxP = Math.max(...planets.map((planet) => planet._P));
        console.log("maxP", maxP / DaysToSeconds)
        this.times = linspace(0, this.orbits * maxP, this.datapoints);
        console.log("orbits", this.orbits)
        this.timesDays = this.times.map((t) => t / DaysToSeconds);
        console.log("Time days", this.timesDays)
    }

}
