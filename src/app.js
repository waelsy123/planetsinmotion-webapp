import {StarMenu} from './starMenu.js'
import {PlanetMenu } from './planetMenu.js';
import {LightcurveMenu } from './lightcurveMenu.js';
import {FrameMenu} from './frameMenu.js'
import {InfoDisplay} from './infoDisplay.js'
import {LightcurveHandler} from './lightcurveHandler.js'
import {OrbitAnimatorCanvasHandler} from './orbitAnimatorCanvasHandler.js'
import fixWebmDuration from "fix-webm-duration";


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

async function loadLanguage(lang="en") {
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

    i = (i + 1) % datapoints;
};

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
        const margin  = {top:20, bottom:40, left:100, right:100}
        lightcurveHandler = new LightcurveHandler("d3-lightcurve-container", 1260, 500, margin)
    }

    if(!faceOnCanvasHandler) {
        faceOnCanvasHandler = new OrbitAnimatorCanvasHandler("faceoncanvas")
    }
    
    if (!edgeOnCanvasHandler) {
        edgeOnCanvasHandler = new OrbitAnimatorCanvasHandler("edgeoncanvas")

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
    if(!helpMenu) {
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
        } else if (event.code=="NumpadAdd") {
            console.log(event.code)
            planetMenu.showPlanetForm()
        }
    });
    
    exportButton.addEventListener("click", () => {lightcurveMenu.exportLightcurve(lightcurveMenu.timesDays, fraction)});
    exportButton.disabled = true
    frameMenu.saveAnimationButton.disabled = true
    frameMenu.saveAnimationButton.addEventListener("click" , () => {
    frameMenu.saveAnimationButton.disabled=true; // Disable the button while we record
    //saveAnimation()});

        recordSVGAnimation(lightcurveHandler, "lightcurve", "video/webm")
    });

    loadLanguage()


}


function downloadVideo(blob, name) {
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = name + ".webm";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveAnimation(format = "video/webm") {
    const canvass = [edgeoncanvas];
    const names = ["faceon", "edgeon", "lightcurve"];
    const duration = lightcurveMenu.datapoints * frameMenu.ms + frameMenu.ms;
    frameMenu.saveAnimationButton.style.cursor = "wait";
    for (let index = 0; index < canvass.length; index++) {
        const canvas = canvass[index];
        const name = names[index];

        console.log(`Saving ${name}...`);
        clearInterval(id);
        restartSimulation(starMenu, planetMenu, lightcurveMenu, frameMenu.ms, 0);

        // Wait for the recording to finish
        await recordCanvas(canvas, name, format, duration);
    }

    frameMenu.saveAnimationButton.style.cursor = "pointer";
    frameMenu.saveAnimationButton.disabled = false;

    console.log("All simulations saved.");
}

async function recordSVGAnimation(svgElement, name, format) {

    const duration = frameMenu.ms * lightcurveMenu.datapoints
    return new Promise((resolve) => {
        const recordedChunks = [];

        // Create an offscreen canvas
        const canvas = document.createElement("canvas");
        canvas.width = svgElement.width;
        canvas.height = svgElement.height;
        const ctx = canvas.getContext("2d");

        // Capture the canvas stream
        const canvasStream = canvas.captureStream(frameMenu.ms);
        const mediaRecorder = new MediaRecorder(canvasStream, { mimeType: format });

        mediaRecorder.ondataavailable = (evt) => {
            if (evt.data.size > 0) {
                recordedChunks.push(evt.data);
            }
        };

        mediaRecorder.onstart = () => {
            console.log(`${name} recording started...`);
        };

        mediaRecorder.onstop = async () => {
            console.log(`${name} recording stopped.`);

            const webBlob = new Blob(recordedChunks, { type: format });
            const fixedBlob = await fixWebmDuration(webBlob, duration);

            downloadVideo(fixedBlob, name);

            resolve();
        };

        mediaRecorder.start();

        // Animate by drawing the SVG to the canvas repeatedly
        const startTime = Date.now();
        const drawFrame = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed >= duration) {
                mediaRecorder.stop();
                return;
            }

            const svgData = new XMLSerializer().serializeToString(svgElement.svg.node());
            const img = new Image();
            const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(svgBlob);

            img.onload = () => {
                ctx.clearRect(0, 0, svgElement.width, svgElement.height);
                ctx.drawImage(img, 0, 0, svgElement.width, svgElement.height);
                URL.revokeObjectURL(url);
            };
            img.src = url;

            requestAnimationFrame(drawFrame);
        };

        drawFrame();
    });
}


function recordCanvas(canvas, name, format, duration) {
    return new Promise((resolve) => {
        const recordedChunks = [];
        const canvasStream = canvas.captureStream(frameMenu.ms); // Capture the canvas stream
        const mediaRecorder = new MediaRecorder(canvasStream, { mimeType: format });

        mediaRecorder.ondataavailable = (evt) => {
            if (evt.data.size > 0) {
                recordedChunks.push(evt.data);
            }
        };

        mediaRecorder.onstart = () => {
            console.log(`${name} recording started...`);
        };

        mediaRecorder.onstop = async () => {
            console.log(`${name} recording stopped.`);

            const webBlob = new Blob(recordedChunks, { type: format });
            const fixedBlob = await fixWebmDuration(webBlob, duration);

            // Download the fixed blob
            downloadVideo(fixedBlob, name);

            // Resolve the promise to indicate that recording is complete
            resolve();
        };

        mediaRecorder.start();

        // Stop recording after the specified duration
        console.log(`Recording for ${name} will stop after ${duration / 1000} seconds.`);
        setTimeout(() => {
            if (mediaRecorder.state === "recording") {
                mediaRecorder.stop();
            }
        }, duration);
    });
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


function restartSimulation(starMenu, planetMenu, lightcurveMenu, ms, start=0) {
    i = start
    console.log("Restarting simu")
    // Clear lightcurve  the canvas if we restart simulation from beginning///
    if (i==0) {
        //linecontext.clearRect(0, 0, linecanvas.width, linecanvas.height); 
        lightcurveHandler.clear()
    }
    const datapoints = lightcurveMenu.datapoints    
    
    /* If there are no valid planets do no update animation */
    if (planetMenu.planets.length > 0) {
        fraction = starMenu.star.getEclipsingAreas(planetMenu.planets);
        const animatePlanets = () => {
            animate(starMenu.star, planetMenu.planets, 
                datapoints, planetMenu.maxDistance); 
        };
        lightcurveHandler.setScales(lightcurveMenu.timesDays, fraction)
        
        faceOnCanvasHandler.setDomains(-planetMenu.maxDistance, planetMenu.maxDistance, -planetMenu.maxDistance, planetMenu.maxDistance, true)
        edgeOnCanvasHandler.setDomains(-planetMenu.maxDistance, planetMenu.maxDistance, -planetMenu.maxDistance, planetMenu.maxDistance, false)
        id = window.setInterval(animatePlanets, ms);
        /*Instead clear the canvas if we run out of planets i.e. if the list if fully removed */
    }  else {
        lightcurveHandler.clear()
        faceOnCanvasHandler.clear()
        edgeOnCanvasHandler.clear()
        //faceoncontext.clearRect(0, 0, faceoncanvas.width, faceoncanvas.height);
        //edgeoncontext.clearRect(0, 0, edgeoncanvas.width, edgeoncanvas.height);  
    }
    //Clear simulation//
    if (!id) {
        clearInterval(id);
    }
}

init();
