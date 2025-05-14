import { StarMenu } from './starMenu.js'
import { PlanetMenu } from './planetMenu.js';
import { LightcurveMenu } from './lightcurveMenu.js';
import { FrameMenu } from './frameMenu.js';
import { InfoDisplay } from './infoDisplay.js';
import { LightcurveHandler } from './lightcurveHandler.js';
import { DonateMenu } from './donateMenu.js';
import { OrbitAnimatorCanvasHandler } from './orbitAnimatorCanvasHandler.js';


//const faceoncanvas = document.getElementById("faceoncanvas")
//const faceoncontext = faceoncanvas.getContext('2d');
//const edgeoncanvas = document.getElementById("edgeoncanvas")
//const linecanvas = document.getElementById("linecanvas")
//const edgeoncontext = edgeoncanvas.getContext('2d');
//const linecontext = linecanvas.getContext('2d');
//linecontext.lineWidth = 1.8


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
let record = false

async function loadLanguage(lang = "en") {
    const res = await fetch(`./locales/${lang}.json`);
    translations = await res.json();
    lightcurveMenu.setLanguage(translations)
    frameMenu.setLanguage(translations)
    planetMenu.setLanguage(translations)
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
        },50);

            console.log("Recording complete.");
            console.log("All simulations saved.");
        }

        recordedFrames++;
    }

    i = (i + 1) % datapoints;
}

/**
function drawLightcurve(linecontext, timesDays, fraction, color, j) {
    // Define the axis ranges
    const xMin = Math.min(...timesDays);
    const xMax = Math.max(...timesDays);
    const yMin = Math.min(...fraction) * 0.95;
    const yMax = Math.max(...fraction) * 1.05;

    // Map axis units to canvas units
    const mapXToCanvas = (x) => ((x - xMin) / (xMax - xMin)) * linecanvas.width;
    const mapYToCanvas = (y) => linecanvas.height - ((y - yMin) / (yMax - yMin)) * linecanvas.height;

    // Clear the line canvas
    if (j==timesDays.length - 1) {
        linecontext.clearRect(0, 0, linecanvas.width, linecanvas.height);   
    }
    // Draw the light curve
    linecontext.save();
    linecontext.beginPath();
    const x1 = mapXToCanvas(timesDays[j]);
    const y1 = mapYToCanvas(fraction[j]);
    const x2 = mapXToCanvas(timesDays[j + 1]);
    const y2 = mapYToCanvas(fraction[j + 1]);

    linecontext.moveTo(x1, y1);
    linecontext.lineTo(x2, y2);
    linecontext.strokeStyle = color;
    linecontext.stroke();
    linecontext.restore();

}
 */
function onStarUpdate() {
    planetMenu.setStar(starMenu.star)
    starMenu.setTimes(lightcurveMenu.times)
    planetMenu.setTimes(lightcurveMenu.times)
    restartSimulation(starMenu, planetMenu, lightcurveMenu, frameMenu.ms, 0)
}

function onStarColorChange() {
    edgeOnCanvasHandler.defineSunGradient(starMenu.star.color)
    faceOnCanvasHandler.defineSunGradient(starMenu.star.color)
    restartSimulation(starMenu, planetMenu, lightcurveMenu, frameMenu.ms, 0)
}

function onDatapointsUpdate() {
    onOrbitsUpdate();
    frameMenu.setDuration((lightcurveMenu.datapoints) * frameMenu.ms);

}

function onOrbitsUpdate() {
    lightcurveMenu.calculateTimes(planetMenu.maxP)
    starMenu.setTimes(lightcurveMenu.times);
    planetMenu.setTimes(lightcurveMenu.times);
    restartSimulation(starMenu, planetMenu, lightcurveMenu, frameMenu.ms, 0);
}

function onUpdatePlanets() {
    onOrbitsUpdate();
    /* Uodate buttons state */
    if (planetMenu.planets.length > 0) {
        exportButton.disabled = false // Enable the button
        exportButton.style.cursor = "pointer"
        frameMenu.saveAnimationButton.disabled = false // Enable the button
        frameMenu.saveAnimationButton.style.cursor = "pointer" // Enable the button
    } else if (planetMenu.planets.length == 0) {
        exportButton.disabled = true // Disable the button
        exportButton.style.cursor = "auto"
        frameMenu.saveAnimationButton.disabled = true // Disable the button
        frameMenu.saveAnimationButton.style.cursor = "auto"
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
        lightcurveMenu = new LightcurveMenu(planetMenu.maxP, onDatapointsUpdate, onOrbitsUpdate);
    }

    // Add listener to the export button
    exportButton = document.getElementById("export-lightcurve");

    if (!frameMenu) {
        frameMenu = new FrameMenu((ms) => {
            frameMenu.setDuration((lightcurveMenu.datapoints) * ms);
            restartSimulation(starMenu, planetMenu, lightcurveMenu, ms, i);
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

    starMenu.setTimes(lightcurveMenu.times)
    planetMenu.setTimes(lightcurveMenu.times)
    frameMenu.setDuration((lightcurveMenu.datapoints) * frameMenu.ms);
    restartSimulation(starMenu, planetMenu, lightcurveMenu, frameMenu.ms)

    const mainCanvas = document.getElementById("main-canvas-container")

    mainCanvas.addEventListener("click", () => {
        pauseAnimation();
    });
    
    // Pause animation on space bar pressing
    document.addEventListener("keydown", (event) => {
        if (event.code === "Space") {
            event.preventDefault(); // Prevent the default behavior of the space bar (e.g., scrolling)
            if (id) {
                pauseAnimation(); // Pause the animation if it's running
            } else {
                restartAnimation(); // Restart the animation if it's paused
            }
        // Show planet form on pressing the "+" button (and not pressing Ctrl)
        } else if ((event.code == "NumpadAdd") && (!event.ctrlKey)) {
            planetMenu.showPlanetForm()
        }
    });

    exportButton.addEventListener("click", () => {
        lightcurveMenu.exportLightcurve(lightcurveMenu.timesDays, fraction)
    });

    exportButton.disabled = true
    
    frameMenu.saveAnimationButton.addEventListener("click", () => {
        saveAnimation()
    });

    loadLanguage()
}

function saveAnimation(format = "video/webm") {
    // Show the recording dialog
    const recordingDialog = document.getElementById("recording-dialog");
    recordingDialog.showModal();

    const duration = frameMenu.animationDurationms;
    [edgeOnCanvasHandler, faceOnCanvasHandler, lightcurveHandler].forEach(element => {
        element.startRecording(frameMenu.ms, format, duration);
    });
    record = true;
    recordedFrames = 0;
    restartSimulation(starMenu, planetMenu, lightcurveMenu, frameMenu.ms, 0);
}


function restartAnimation() {
    console.log("Restarting animation");
    if (!id) {
        restartSimulation(starMenu, planetMenu, lightcurveMenu, frameMenu.ms, i)
    }
    const mainCanvas = document.getElementById("main-canvas-container")
    // Change the event listener back to pause the animation
    mainCanvas.removeEventListener("click", restartAnimation);
    mainCanvas.addEventListener("click", pauseAnimation);
}

function pauseAnimation() {
    console.log("Pausing animation");
    if (id) {
        clearInterval(id); // Stop the animation
        id = null; // Reset the interval ID
    }
    // Change the event listener to restart the animation
    const mainCanvas = document.getElementById("main-canvas-container")
    mainCanvas.removeEventListener("click", pauseAnimation);
    mainCanvas.addEventListener("click", restartAnimation);
}


function restartSimulation(starMenu, planetMenu, lightcurveMenu, ms, start = 0) {
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
        fraction = starMenu.star.getEclipsingAreas(planetMenu.planets);
        lightcurveHandler.setScales(lightcurveMenu.timesDays, fraction);
        const limits = Math.abs(planetMenu.maxDistance *1.02);
        faceOnCanvasHandler.setDomains(-limits, limits, -limits, limits, true);
        edgeOnCanvasHandler.setDomains(-limits, limits, -limits, limits, false);
        id = window.setInterval(animate, ms);
        /*Instead clear the canvas if we run out of planets i.e. if the list if fully removed */
    } else {
        console.log("No planets to animate, clearing canvas");
        lightcurveHandler.clear();
        faceOnCanvasHandler.clear();
        edgeOnCanvasHandler.clear();
        //faceoncontext.clearRect(0, 0, faceoncanvas.width, faceoncanvas.height);
        //edgeoncontext.clearRect(0, 0, edgeoncanvas.width, edgeoncanvas.height);  
    }
}

init();
