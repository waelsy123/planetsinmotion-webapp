import {DaysToSeconds} from './constants.js'
import {linspace, downloadBlob} from './utils.js'
import { ToolTipLabel } from './toolTipLabel';


export class LightcurveMenu {
    constructor(maxP, onDatapointsUpdate, onOrbitsUpdate, recaculateEclipse) {
        this.onDatapointsUpdate = onDatapointsUpdate; // Callback to restart the simulation when datapoints is updated
        this.onOrbitsUpdate = onOrbitsUpdate; // Callback to restart the simulation when orbits is updated  
        this.onMcPointsUpdate = recaculateEclipse;
        // Initialize menu elements
        this.initLightcurveMenu();
        // Just to initialize the values
        this.calculateTimes(maxP);


    }

    setLanguage(translations) {
        // Add all the labels that require language
        this.datapointsLabel.setLanguage(translations);
        this.orbitsLabel.setLanguage(translations);
        this.mcPointsLabel.setLanguage(translations);
    }


    initLightcurveMenu() {
        /// Datapoints
        const datapointsInput = document.getElementById("input-datapoints");
        this.datapoints = parseInt(datapointsInput.value);
        this.datapointsLabel = new ToolTipLabel("datapoints")

        /// Orbits
        const orbitsInput = document.getElementById("orbits");
        this.orbits = parseInt(orbitsInput.value);
        this.orbitsLabel = new ToolTipLabel("orbits");

        // MC points
        this.mcPointsInput = document.getElementById("input-mc-points");
        this.mcPoints = parseInt(this.mcPointsInput.value);
        this.mcPointsLabel = new ToolTipLabel("mc-points");
        // Add event listeners for inputs
        this.mcPointsInput.addEventListener("input", (event) => {
            const min = parseFloat(event.target.min);
            if (event.target.value < min) {
                event.target.value = min; // Reset to minimum
            }
            this.mcPoints = parseInt(event.target.value); 
            this.onMcPointsUpdate(); // Trigger recalculation of eclipse
        });



        datapointsInput.addEventListener("input", (event) => {
            const min = parseFloat(event.target.min);
            if (event.target.value < min) {
                event.target.value = min; // Reset to minimum
            }
            this.datapoints = parseInt(event.target.value); 
            this.onDatapointsUpdate(); // Trigger simulation update
            
        });

        orbitsInput.addEventListener("input", (event) => {
            const min = parseFloat(event.target.min);
            if (event.target.value < min) {
                event.target.value = min; // Reset to minimum
            }

            this.orbits = parseInt(event.target.value);
            this.onOrbitsUpdate(); // Trigger simulation update
        });

    }

    calculateTimes(maxP){
        this.times = linspace(0, this.orbits * maxP, this.datapoints);
        this.timesDays = this.times.map((t) => t / DaysToSeconds);
        console.log("Time days", this.timesDays);
    }
   

    exportLightcurve(timesDays, fraction) {
        // Prepare the lightcurve data
        const header = "Time (days),RelativeFlux";
        const data = timesDays.map((time, index) => `${time.toFixed(4)},${fraction[index].toFixed(5)}`).join("\n");
        const csvContent = `${header}\n${data}`; // Combine header and data
        const blob = new Blob([csvContent], { type: "text/csv" });
        downloadBlob(blob, "lightcurve", "csv")
    }

}
