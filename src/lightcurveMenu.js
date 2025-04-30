import {DaysToSeconds} from './constants.js'
import {linspace} from './utils.js'
import { ToolTipLabel } from './toolTipLabel';


export class LightcurveMenu {
    constructor(maxP, onUpdate) {
        this.onUpdate = onUpdate; // Callback to restart the simulation

        // Initialize menu elements
        this.initLightcurve(maxP);

    }

    setLanguage(translations) {
        this.datapointsLabel.setLanguage(translations)
        this.orbitsLabel.setLanguage(translations)
    }



    initLightcurve(maxP) {
        /// Datapoints
        const datapointsInput = document.getElementById("input-datapoints");
        this.datapoints = parseInt(datapointsInput.value);
        this.datapointsLabel = new ToolTipLabel("datapoints")

        /// Orbits
        const orbitsInput = document.getElementById("orbits");
        this.orbits = parseInt(orbitsInput.value);
        this.orbitsLabel = new ToolTipLabel("orbits")

        this.calculateTimes(maxP);

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

            this.calculateTimes(maxP);

            this.onUpdate(); // Trigger simulation update
        });

    }

    calculateTimes(maxP){
        this.times = linspace(0, this.orbits * maxP, this.datapoints);
        this.timesDays = this.times.map((t) => t / DaysToSeconds);
        console.log("Time days", this.timesDays)
    }
   

    exportLightcurve(timesDays, fraction) {
        // Prepare the lightcurve data
        const header = "Time (days),RelativeFlux";
        const data = timesDays.map((time, index) => `${time.toFixed(4)},${fraction[index].toFixed(5)}`).join("\n");
        const csvContent = `${header}\n${data}`; // Combine header and data
        const blob = new Blob([csvContent], { type: "text/csv" });
        
        // Create a download link
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "lightcurve.csv"; // Default filename
        a.style.display = "none";
        console.log("Exporting lightcurve", a)

        // Append the link to the document and trigger the download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

}
