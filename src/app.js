import {StarMenu} from './starMenu.js'
import { PlanetMenu } from './planetMenu.js';
import { LightcurveMenu } from './lightcurveMenu.js';
import {FrameMenu} from './frameMenu.js'
import { maxDependencies } from 'mathjs';

const faceoncanvas = document.getElementById("faceoncanvas")
const edgeoncanvas = document.getElementById("edgeoncanvas")
const linecanvas = document.getElementById("linecanvas")
const faceoncontext = faceoncanvas.getContext('2d');
const edgeoncontext = edgeoncanvas.getContext('2d');
const linecontext = linecanvas.getContext('2d');
linecontext.lineWidth = 1.5

let i = 0;

function drawTicks(context, canvas, maxDistance, isXAxis = true) {
    const tickCount = 4; // Number of ticks
    const tickLength = 14; // Length of each tick in pixels
    const fontSize = 12; // Font size for labels
    const padding = 20; // Padding for labels

    context.font = `${fontSize}px Arial`;
    context.fillStyle = "white";
    context.strokeStyle = "white";
    context.lineWidth = 1;

    const tickInterval = (parseInt(maxDistance) + 1) / tickCount;

    for (let i = 0; i <= tickCount; i++) {
        const value = i * tickInterval;
        const position = (value / maxDistance) * (canvas.width / 2);

        if (isXAxis) {
            const ypos = canvas.height
            const x = canvas.width / 2 + position;
            const xNeg = canvas.width / 2 - position;

            // Positive tick
            context.beginPath();
            context.moveTo(x, ypos - tickLength / 2);
            context.lineTo(x, ypos + tickLength / 2);
            context.stroke();

            // Negative tick
            context.beginPath();
            context.moveTo(xNeg, ypos - tickLength / 2);
            context.lineTo(xNeg, ypos + tickLength / 2);
            context.stroke();

        } else {
            const xpos = 0
            const y = canvas.height / 2 - position;
            const yNeg = canvas.height / 2 + position;

            // Positive tick
            context.beginPath();
            context.moveTo(xpos - tickLength / 2, y);
            context.lineTo(xpos  + tickLength / 2, y);
            context.stroke();

            // Negative tick
            context.beginPath();
            context.moveTo(xpos - tickLength / 2, yNeg);
            context.lineTo(xpos + tickLength / 2, yNeg);
            context.stroke();

        }
    }
}

// Animate the frames
const animate = (star, planets, ratio, fraction, timesDays, datapoints, maxDistance) => {

    
    faceoncontext.globalCompositeOperation = "destination-over";
    faceoncontext.clearRect(0, 0, faceoncanvas.width, faceoncanvas.height);
    
    // Draw ticks
    drawTicks(faceoncontext, faceoncanvas, maxDistance, true); // X-axis
    drawTicks(faceoncontext, faceoncanvas, maxDistance, false); // Y-axis
    
    
    const bodies = [star, ...planets];
    // Sort bodies for edge-on view (x-direction)
    const sortedBodiesFaceOn = bodies.slice().sort((a, b) => b.rz[i] - a.rz[i]);
           
    // Draw planets for face-on view
    sortedBodiesFaceOn.forEach((body) => {
        drawBody(faceoncontext, faceoncanvas, body.ry[i], body.rx[i], body, ratio)
    });

    edgeoncontext.globalCompositeOperation = "destination-over";
    edgeoncontext.clearRect(0, 0, edgeoncanvas.width, 
        edgeoncanvas.height);

    // Sort bodies for face-on view (z-direction)
    const sortedBodiesEdgeOn = bodies.slice().sort((a, b) => b.rx[i] - a.rx[i]);
    
    // Draw bodies for edge-on view
    sortedBodiesEdgeOn.forEach((body) => {
        drawBody(edgeoncontext, edgeoncanvas, body.ry[i], body.rz[i], body, ratio)
    });

    drawLightcurve(linecontext, timesDays, fraction, star.color, i);
    i = (i + 1) % datapoints;
};

function drawBody(context, canvas, x, y, body, ratio) {
    // Draw star face on
    context.save()
    context.beginPath();
    context.arc(canvas.width / 2 + x * ratio, 
        canvas.height / 2  + y * ratio, body._R * ratio, 0, 2 * Math.PI);
    context.fillStyle = body.color
    context.fill();
    context.restore()
}

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


function init() {

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
        lightcurveMenu.calculateTimes(planetMenu.planets)
        starMenu.setTimes(lightcurveMenu.times)
        planetMenu.setTimes(lightcurveMenu.times)
        /* Uodate buttons state */        
        if (lightcurveMenu.exportButton.disabled && planetMenu.planets.length > 0) {
            lightcurveMenu.exportButton.disabled = false // Enable the button
            frameMenu.saveAnimationButton.disabled = false // Enable the button
        } else if (!lightcurveMenu.exportButton.disabled && planetMenu.planets.length == 0) {
            lightcurveMenu.exportButton.disabled = true // Disable the button
            frameMenu.saveAnimationButton.disabled = true // Disable the button
        }
        restartSimulation(starMenu, planetMenu, lightcurveMenu, frameMenu.ms); // Restart the simulation

    }, starMenu.star);

    if (!lightcurveMenu) {
        lightcurveMenu = new LightcurveMenu(planetMenu.planets, () => {
            clearInterval(id);
            lightcurveMenu.calculateTimes(planetMenu.planets)
            starMenu.setTimes(lightcurveMenu.times)
            planetMenu.setTimes(lightcurveMenu.times)
            restartSimulation(starMenu, planetMenu, lightcurveMenu, frameMenu.ms);
        })
    }

    if (!frameMenu) {
        frameMenu = new FrameMenu(() => {
            clearInterval(id);
            restartSimulation(starMenu, planetMenu, lightcurveMenu, frameMenu.ms, i);
        });
    }
       
    } 
    starMenu.setTimes(lightcurveMenu.times)
    planetMenu.setTimes(lightcurveMenu.times)
    restartSimulation(starMenu, planetMenu, lightcurveMenu, frameMenu.ms)

    const mainCanvas = document.getElementById("main-canvas-container")
    mainCanvas.addEventListener("click", (event) => {
        pauseAnimation()
    });

    lightcurveMenu.exportButton.addEventListener("click", () => {exportLightcurve(lightcurveMenu.timesDays, fraction)});
    frameMenu.saveAnimationButton.addEventListener("click" , () => {saveAnimation()});

}


function exportLightcurve(timesDays, fraction) {
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

function saveAnimation(){
    const canvas = document.getElementById("edgeoncanvas");
    const link = document.createElement("a");
    link.download = "simulation.gif";
    canvas.toBlob((blob) => {
        link.href = URL.createObjectURL(blob);
        link.click();
    }, "image/gif");
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
        linecontext.clearRect(0, 0, linecanvas.width, linecanvas.height);   
    }
    const datapoints = lightcurveMenu.datapoints
    const screenmin = Math.min(faceoncanvas.width, faceoncanvas.height)
    const ratio = screenmin / 2 / (planetMenu.maxDistance);
    
    
    /* If there are no valid planets do no update animation */
    if (planetMenu.planets.length > 0) {
        fraction = starMenu.star.getEclipsingAreas(planetMenu.planets);
        const animatePlanets = () => {
            animate(starMenu.star, planetMenu.planets, ratio, fraction, lightcurveMenu.timesDays, 
                datapoints, planetMenu.maxDistance); 
        };
        id = window.setInterval(animatePlanets, ms);
        /*Instead clear the canvas if we run out of planets i.e. if the list if fully removed */
    }  else {
        faceoncontext.clearRect(0, 0, faceoncanvas.width, faceoncanvas.height);
        edgeoncontext.clearRect(0, 0, edgeoncanvas.width, edgeoncanvas.height);  
    }
    //Clear simulation//
    if (!id) {
        clearInterval(id);
    }
}

let planetMenu;
let starMenu;
let lightcurveMenu;
let frameMenu;
let id;
let fraction;
init();


