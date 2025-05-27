import { StarMenu } from './starMenu.js'
import { PlanetMenu } from './planetMenu.js';
import { LightcurveMenu } from './lightcurveMenu.js';
import { FrameMenu } from './frameMenu.js';
import { InfoDisplay } from './infoDisplay.js';
import { LightcurveHandler } from './lightcurveHandler.js';
import { DonateMenu } from './donateMenu.js';
import { Transit } from './transit.js';
import { OrbitAnimatorCanvasHandler } from './orbitAnimatorCanvasHandler.js';
import { MonteCarloTransitCalculator } from './monteCarloTransitCalculator.js';


let planetMenu;
let starMenu;
let lightcurveMenu;
let frameMenu;
let helpMenu;
let aboutMenu;
let donateMenu;
let translations = {};
let id;
let fraction;
let lightcurveHandler;
let faceOnCanvasHandler;
let edgeOnCanvasHandler;
let exportButton;
let i = 0;
let recordedFrames;
let mainCanvas;
let record = false;
let monteCarloTransitCalculator;

async function loadLanguage(lang = "en") {
    const res = await fetch(`./locales/${lang}.json`);
    translations = await res.json();
    lightcurveMenu.setLanguage(translations);
    frameMenu.setLanguage(translations);
    planetMenu.setLanguage(translations);
    aboutMenu.setLanguage(translations);
    helpMenu.setLanguage(translations);
    donateMenu.setLanguage(translations);
}


// Animate the frames
const animate = () => {

    const star = starMenu.star
    const planets = planetMenu.planets
    const datapoints = lightcurveMenu.datapoints


    const bodies = [star, ...planets];
    // Sort bodies for face-on view (z-direction)
    const sortedBodiesFaceOn = bodies.slice().sort((a, b) => a.rz[i] - b.rz[i]);
    faceOnCanvasHandler.drawBodies(sortedBodiesFaceOn, i, true)
    
    // Sort bodies for edge-on view (x-direction)
    const sortedBodiesEdgeOn = bodies.slice().sort((a, b) => a.rx[i] - b.rx[i]);
    edgeOnCanvasHandler.drawBodies(sortedBodiesEdgeOn, i)

    //drawLightcurve(linecontext, timesDays, fraction, star.color, i);
    lightcurveHandler.drawLightcurved3(star.color, i)
    if (record) {
        [edgeOnCanvasHandler, faceOnCanvasHandler, lightcurveHandler].forEach(element => {
            element.updateRecording();
        });

        if (recordedFrames == datapoints + 1) {
            console.log("Finishing recording");

            record = false;
            setTimeout(() => {
            [edgeOnCanvasHandler, faceOnCanvasHandler, lightcurveHandler].forEach(handler => {
                console.log("Stopping recording");
                handler.stopRecording();
            });

             // Hide the recording dialog
            const recordingDialog = document.getElementById("recording-dialog");
            recordingDialog.close();
            document.body.style.cursor = "default";
        },50);

            console.log("Recording complete.");
            console.log("All simulations saved.");
        }

        recordedFrames++;
    }

    i = (i + 1) % datapoints;
}

function onStarUpdate() {
    planetMenu.setStar(starMenu.star)
    monteCarloTransitCalculator.star = starMenu.star;
    updateSimulation();
}

function onStarColorChange() {
    edgeOnCanvasHandler.defineSunGradient(starMenu.star.color)
    faceOnCanvasHandler.defineSunGradient(starMenu.star.color)
    restartSimulation(0)
}

function onDatapointsUpdate() {
    // Trigger simulation update when the times have changed
    onTimesUpdate();
    // update Frame Menu duration
    frameMenu.setDuration((lightcurveMenu.datapoints) * frameMenu.ms);
}

function onTimesUpdate() {
    // Calculate the times based on the current maxP
    lightcurveMenu.calculateTimes(planetMenu.maxP)
    // update simulation
    updateSimulation();
}

function recalculateEclipse() {
    //console.time("getEclipsingAreasMonteCarlo"); // Start timing
    if (planetMenu.planets.length ==1) {
        // Use analytical calculation if only one planet
        const transit = new Transit(starMenu.star, planetMenu.planets[0]);
        fraction = transit.visibleFraction;
        lightcurveMenu.mcPointsInput.disabled = true; // Disable MC points input if only one planet
    } else {
        // Monte Carlo calculation for multiple planets
        //fraction = starMenu.star.getEclipsingAreasMonteCarloPrecompute(planetMenu.planets, lightcurveMenu.mcPoints);
        fraction = monteCarloTransitCalculator.getEclipsedFraction(planetMenu.planets);
        lightcurveMenu.mcPointsInput.disabled = false; // Disable MC points input if only one planet
    
    }
    //console.timeEnd("getEclipsingAreasMonteCarlo"); // End timing and print result
    
    console.log("Transit depth: ", (Math.min(...fraction)).toFixed(3));
}

function onMcPointsUpdate() {
    // this already redraws the random samples
    monteCarloTransitCalculator.numSamples = lightcurveMenu.mcPoints;
    recalculateEclipse();
    restartSimulation(0);
}

function updateSimulation() {
    console.log("Updating simulation")
    starMenu.setTimes(lightcurveMenu.times);
    planetMenu.setTimes(lightcurveMenu.times);
    recalculateEclipse();
    const limits = Math.abs(planetMenu.maxDistance *1.02);
    faceOnCanvasHandler.setDomains(-limits, limits, -limits, limits, true);
    edgeOnCanvasHandler.setDomains(-limits, limits, -limits, limits, false);
    restartSimulation(0);
}

function onUpdatePlanets() {
    /* Uodate buttons state */
    if (planetMenu.planets.length > 0) {
        exportButton.disabled = false // Enable the button
        exportButton.style.cursor = "pointer"
        frameMenu.saveAnimationButton.disabled = false // Enable the button
        frameMenu.saveAnimationButton.style.cursor = "pointer" // Enable the button
        // We update the lightcurve times due to the planets period
        onTimesUpdate();

    } else if (planetMenu.planets.length == 0) {
        exportButton.disabled = true // Disable the button
        exportButton.style.cursor = "auto"
        frameMenu.saveAnimationButton.disabled = true // Disable the button
        frameMenu.saveAnimationButton.style.cursor = "auto"

        // If there are no planets, clear the canvas
        console.log("No planets to animate, clearing canvas");
        lightcurveHandler.clear();
        faceOnCanvasHandler.clear();
        edgeOnCanvasHandler.clear();
    }
}


function init() {

    if (!lightcurveHandler) {
        const margin = { top: 10, bottom: 40, left: 80, right: 80 } // checked
        lightcurveHandler = new LightcurveHandler("d3-lightcurve-container", 1320, 500, margin)
    }

    if (!faceOnCanvasHandler) {
        faceOnCanvasHandler = new OrbitAnimatorCanvasHandler("faceoncanvas", "faceon")
    }

    if (!edgeOnCanvasHandler) {
        edgeOnCanvasHandler = new OrbitAnimatorCanvasHandler("edgeoncanvas", "edgeon")
    }

    if (!starMenu) {
        starMenu = new StarMenu(onStarUpdate, onStarColorChange)
    }
    // Set the star color gradient in the canvas handlers
    edgeOnCanvasHandler.defineSunGradient(starMenu.star.color)
    faceOnCanvasHandler.defineSunGradient(starMenu.star.color)

    if (!planetMenu) {
        planetMenu = new PlanetMenu(onUpdatePlanets, pauseAnimation, restartAnimation, starMenu.star);
    }

    if (!lightcurveMenu) {
        lightcurveMenu = new LightcurveMenu(planetMenu.maxP, onDatapointsUpdate, onTimesUpdate, onMcPointsUpdate);
        lightcurveMenu.mcPointsInput.disabled = true; // Disable MC points input if only one planet
    }

    // Add listener to the export button
    exportButton = document.getElementById("export-lightcurve");

    if (!frameMenu) {
        frameMenu = new FrameMenu((ms) => {
            frameMenu.setDuration((lightcurveMenu.datapoints) * ms);
            restartSimulation(i);
        });
    }

    if (!aboutMenu) {
        aboutMenu = new InfoDisplay("about")
    }
    if (!helpMenu) {
        helpMenu = new InfoDisplay("manual")
    }

    if (!donateMenu) {
        donateMenu = new DonateMenu("donate")
    }
    // this needs to be done for the planet menu form canvas to work!
    starMenu.setTimes(lightcurveMenu.times);
    planetMenu.setTimes(lightcurveMenu.times);
    frameMenu.setDuration((lightcurveMenu.datapoints) * frameMenu.ms);
    mainCanvas = document.getElementById("main-canvas-container")
    mainCanvas.addEventListener("click", toggleAnimation);
    
    // Pause animation on space bar pressing
    document.addEventListener("keydown", (event) => {
        if (event.code === "Space") {
            event.preventDefault(); // Prevent the default behavior of the space bar (e.g., scrolling)
            toggleAnimation(); // Toggle the animation state
        // Show planet form on pressing the "+" button (and not pressing Ctrl)
        } else if ((event.code == "NumpadAdd") && (!event.ctrlKey)) {
            console.log("Show planet form");
            planetMenu.showPlanetForm();
        }
    });

    exportButton.addEventListener("click", () => {
        lightcurveMenu.exportLightcurve(lightcurveMenu.timesDays, fraction)
    });

    exportButton.disabled = true;
    
    frameMenu.saveAnimationButton.addEventListener("click", () => {
        saveAnimation();
    });

    loadLanguage();

    monteCarloTransitCalculator = new MonteCarloTransitCalculator(starMenu.star, lightcurveMenu.mcPoints);
}


function saveAnimation(format = "video/webm") {
    // Set the pointer to "loading" mode
    document.body.style.cursor = "wait";
    // Show the recording dialog
    const recordingDialog = document.getElementById("recording-dialog");
    recordingDialog.showModal();

    const duration = frameMenu.animationDurationms;
    [edgeOnCanvasHandler, faceOnCanvasHandler, lightcurveHandler].forEach(element => {
        element.startRecording(frameMenu.ms, format, duration);
    });
    record = true;
    recordedFrames = 0;
    restartSimulation(0);
}

function toggleAnimation() {
    if (id) {
        pauseAnimation(); // Pause the animation if it's running
    } else {
        restartAnimation(); // Restart the animation if it's paused
    }
}

function restartAnimation() {
    console.log("Restarting animation");
    if (!id) {
        restartSimulation(i)
    }
}

function pauseAnimation() {
    console.log("Pausing animation");
    if (id) {
        clearInterval(id); // Stop the animation
        id = null; // Reset the interval ID
    }
}


function restartSimulation(start = 0) {
    i = start;
    console.log("Restarting simu")

    //Clear simulation//
    if (id) { 
        clearInterval(id);
        id = null; // Reset the interval ID
    }
    // Clear lightcurve  the canvas if we restart simulation from beginning///
    if (i == 0) {
        //linecontext.clearRect(0, 0, linecanvas.width, linecanvas.height); 
        lightcurveHandler.clear();
    }

    /* If there are no valid planets do no update animation */
    if (planetMenu.planets.length > 0) {
        lightcurveHandler.setScales(lightcurveMenu.timesDays, fraction);
        id = window.setInterval(animate, frameMenu.ms);
    }
}

init();
