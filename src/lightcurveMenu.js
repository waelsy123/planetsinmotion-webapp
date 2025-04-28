import {DaysToSeconds} from './constants.js'
import {linspace} from './utils.js'
import { ToolTipLabel } from './toolTipLabel';


export class LightcurveMenu {
    constructor(planets, onUpdate) {
        this.onUpdate = onUpdate; // Callback to restart the simulation

        // Initialize menu elements
        this.initLightcurve(planets);

    }

    setLanguage(translations) {
        this.datapointsLabel.setLanguage(translations)
        this.orbitsLabel.setLanguage(translations)
    }



    initLightcurve(planets) {
        /// Datapoints
        const datapointsInput = document.getElementById("input-datapoints");
        this.datapoints = parseInt(datapointsInput.value);
        this.datapointsLabel = new ToolTipLabel("datapoints")

        /// Orbits
        const orbitsInput = document.getElementById("orbits");
        this.orbits = parseInt(orbitsInput.value);
        this.orbitsLabel = new ToolTipLabel("orbits")

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
        this.times = linspace(0, this.orbits * maxP, this.datapoints);
        this.timesDays = this.times.map((t) => t / DaysToSeconds);
        console.log("Time days", this.timesDays)
    }

}
