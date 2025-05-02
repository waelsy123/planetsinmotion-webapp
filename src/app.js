import { StarMenu } from './starMenu.js'
import { PlanetMenu } from './planetMenu.js';
import { LightcurveMenu } from './lightcurveMenu.js';
import { FrameMenu } from './frameMenu.js'
import { InfoDisplay } from './infoDisplay.js'
import { LightcurveHandler } from './lightcurveHandler.js'
import { OrbitAnimatorCanvasHandler } from './orbitAnimatorCanvasHandler.js'


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
const animate = (star, planets, datapoints) => {

    const bodies = [star, ...planets];
    // Sort bodies for edge-on view (x-direction)
    const sortedBodiesFaceOn = bodies.slice().sort((a, b) => a.rz[i] - b.rz[i]);
    faceOnCanvasHandler.drawBodies(sortedBodiesFaceOn, i, true)

    // Sort bodies for face-on view (z-direction)
    const sortedBodiesEdgeOn = bodies.slice().sort((a, b) => a.rx[i] - b.rx[i]);

    edgeOnCanvasHandler.drawBodies(sortedBodiesEdgeOn, i)

    //drawLightcurve(linecontext, timesDays, fraction, star.color, i);
    lightcurveHandler.drawLightcurved3(star.color, i)

    if (record) {
        [edgeOnCanvasHandler, faceOnCanvasHandler, lightcurveHandler].forEach(element => {
            element.updateRecording();
        });

        

        if (recordedFrames == datapoints ) {
            console.log("Finishing recording");

            record = false;

            [edgeOnCanvasHandler, faceOnCanvasHandler, lightcurveHandler].forEach(handler => {
                console.log("Stopping recording");
                handler.stopRecording();
            });
    
            console.log("Recording complete.");

            frameMenu.saveAnimationButton.style.cursor = "pointer";
            frameMenu.disable(false)
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
function init() {

    if (!lightcurveHandler) {
        const margin = { top: 10, bottom: 40, left: 80, right: 80 } // checked
        lightcurveHandler = new LightcurveHandler("d3-lightcurve-container", 1330, 500, margin)
    }

    if (!faceOnCanvasHandler) {
        faceOnCanvasHandler = new OrbitAnimatorCanvasHandler("faceoncanvas", "faceon")
    }

    if (!edgeOnCanvasHandler) {
        edgeOnCanvasHandler = new OrbitAnimatorCanvasHandler("edgeoncanvas", "edgeon")

    }

    if (!starMenu) {
        starMenu = new StarMenu(() => {
            clearInterval(id);
            planetMenu.setStar(starMenu.star)
            starMenu.setTimes(lightcurveMenu.times)
            planetMenu.setTimes(lightcurveMenu.times)
            restartSimulation(starMenu, planetMenu, lightcurveMenu, frameMenu.ms, 0)
        });
    }


    if (!planetMenu) {
        planetMenu = new PlanetMenu(() => {
            clearInterval(id);
            lightcurveMenu.calculateTimes(planetMenu.maxP)
            starMenu.setTimes(lightcurveMenu.times)
            planetMenu.setTimes(lightcurveMenu.times)
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
            restartSimulation(starMenu, planetMenu, lightcurveMenu, frameMenu.ms); // Restart the simulation

        }, starMenu.star);

    }

    if (!lightcurveMenu) {
        lightcurveMenu = new LightcurveMenu(planetMenu.maxP, () => {
            clearInterval(id);
            lightcurveMenu.calculateTimes(planetMenu.maxP)
            starMenu.setTimes(lightcurveMenu.times)
            planetMenu.setTimes(lightcurveMenu.times)
            restartSimulation(starMenu, planetMenu, lightcurveMenu, frameMenu.ms);
        })
    }

    // Add listener to the export button
    exportButton = document.getElementById("export-lightcurve");

    if (!frameMenu) {
        frameMenu = new FrameMenu((ms) => {
            clearInterval(id);
            restartSimulation(starMenu, planetMenu, lightcurveMenu, ms, i);
        });
    }

    if (!aboutMenu) {
        aboutMenu = new InfoDisplay("about")
    }
    if (!helpMenu) {
        helpMenu = new InfoDisplay("manual")
    }

    starMenu.setTimes(lightcurveMenu.times)
    planetMenu.setTimes(lightcurveMenu.times)
    restartSimulation(starMenu, planetMenu, lightcurveMenu, frameMenu.ms)

    const mainCanvas = document.getElementById("main-canvas-container")

    mainCanvas.addEventListener("click", () => {
        pauseAnimation()
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
        // Show planet form on pressing the "+" button
        } else if (event.code == "NumpadAdd") {
            planetMenu.showPlanetForm()
        }
    });

    exportButton.addEventListener("click", () => {
        lightcurveMenu.exportLightcurve(lightcurveMenu.timesDays, fraction)
    });

    exportButton.disabled = true
    
    frameMenu.saveAnimationButton.addEventListener("click", () => {
        frameMenu.disable(true)
        frameMenu.saveAnimationButton.style.cursor = "wait";

        saveAnimation()
    });

    loadLanguage()
}

async function saveAnimation(format = "video/webm") {
    const duration = lightcurveMenu.datapoints * frameMenu.ms;
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
    i = start
    console.log("Restarting simu")

    //Clear simulation//
    if (id) {
        clearInterval(id);
    }
    // Clear lightcurve  the canvas if we restart simulation from beginning///
    if (i == 0) {
        //linecontext.clearRect(0, 0, linecanvas.width, linecanvas.height); 
        lightcurveHandler.clear()
    }

    /* If there are no valid planets do no update animation */
    if (planetMenu.planets.length > 0) {
        fraction = starMenu.star.getEclipsingAreas(planetMenu.planets);
        const animatePlanets = () => {
            animate(starMenu.star, planetMenu.planets,
                lightcurveMenu.datapoints);
        };
        lightcurveHandler.setScales(lightcurveMenu.timesDays, fraction)
        const limits = Math.abs(planetMenu.maxDistance *1.02)
        faceOnCanvasHandler.setDomains(-limits, limits, -limits, limits, true)
        edgeOnCanvasHandler.setDomains(-limits, limits, -limits, limits, false)
        id = window.setInterval(animatePlanets, ms);
        /*Instead clear the canvas if we run out of planets i.e. if the list if fully removed */
    } else {
        lightcurveHandler.clear()
        faceOnCanvasHandler.clear()
        edgeOnCanvasHandler.clear()
        //faceoncontext.clearRect(0, 0, faceoncanvas.width, faceoncanvas.height);
        //edgeoncontext.clearRect(0, 0, edgeoncanvas.width, edgeoncanvas.height);  
    }
}

init();
