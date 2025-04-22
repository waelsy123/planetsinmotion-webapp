import {StarMenu} from './starMenu.js'
import { PlanetMenu } from './planetMenu.js';
import { LightcurveMenu } from './lightcurveMenu.js';
import {FrameMenu} from './frameMenu.js'
import { getBeta, getAlpha, transitArea } from './trigonometry.js';

const faceoncanvas = document.getElementById("faceoncanvas")
const edgeoncanvas = document.getElementById("edgeoncanvas")
const linecanvas = document.getElementById("linecanvas")
const faceoncontext = faceoncanvas.getContext('2d');
const edgeoncontext = edgeoncanvas.getContext('2d');
const linecontext = linecanvas.getContext('2d');
linecontext.lineWidth = 1.5

let i = 0;

// Animate the frames
const animate = (star, planets, ratio, fraction, timesDays, datapoints) => {
    const bodies = [star, ...planets];
    faceoncontext.globalCompositeOperation = "destination-over";
    faceoncontext.clearRect(0, 0, faceoncanvas.width, 
        faceoncanvas.height);

    // Draw star face on
    // Sort planets for edge-on view (x-direction)
    const sortedBodiesFaceOn = bodies.slice().sort((a, b) => b.rz[i] - a.rz[i]);
           
    // Draw planets for face-on view
    sortedBodiesFaceOn.forEach((body) => {
        drawBody(faceoncontext, faceoncanvas, body.ry[i], body.rx[i], body, ratio)
    });

    edgeoncontext.globalCompositeOperation = "destination-over";
    edgeoncontext.clearRect(0, 0, edgeoncanvas.width, 
        edgeoncanvas.height);

    // Sort planets for face-on view (z-direction)
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
            restartSimulation(starMenu, planetMenu, lightcurveMenu, frameMenu.ms)
        });
    }
    
    if (!planetMenu) {
        planetMenu = new PlanetMenu(() => {
        clearInterval(id);
        lightcurveMenu.calculateTimes(planetMenu.planets)
        starMenu.setTimes(lightcurveMenu.times)
        planetMenu.setTimes(lightcurveMenu.times)
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
            restartSimulation(starMenu, planetMenu, lightcurveMenu, frameMenu.ms);
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

}

function restartAnimation() {
    console.log("Restarting animation");
    if (!id) {
        const datapoints = lightcurveMenu.datapoints;
        const screenmin = Math.min(faceoncanvas.width, faceoncanvas.height);
        const ratio = screenmin / 2 / planetMenu.maxDistance;

        const fraction = planetMenu.planets.length > 0
            ? planetMenu.planets.map((planet) => planet.getEclipsedArea(starMenu.star))
            : [];

        const animatePlanets = () => {
            animate(starMenu.star, planetMenu.planets, ratio, fraction, 
                lightcurveMenu.timesDays, datapoints, frameMenu.ms);
        };

        id = window.setInterval(animatePlanets, frameMenu.ms); // Restart the animation
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


function restartSimulation(starMenu, planetMenu, lightcurveMenu, ms) {
    console.log("Restarting simu")
    i = 0
    const datapoints = lightcurveMenu.datapoints
    linecontext.clearRect(0, 0, linecanvas.width, linecanvas.height);   
    const screenmin = Math.min(faceoncanvas.width, faceoncanvas.height)
    const ratio = screenmin / 2 / (planetMenu.maxDistance);
    
    /* If there are no valid planets do no update animation */
    if (planetMenu.planets.length > 0) {
        var previousPlanets = new Array(planetMenu.planets.length)
        var A = new Array(datapoints).fill(0);

        /*Sort planets by size*/
        const sortedPlanets = planetMenu.planets.slice().sort((a, b) => b.R - a.R);

        sortedPlanets.forEach((planet, planetIndex) => {
            /* Get eclipses due to this planet*/
            const Aplanet = planet.getEclipsedArea(starMenu.star);
            A = A.map((area, index) => area + Aplanet[index]);

            /* Get eclipses due to other planets and subtract them */
            previousPlanets.forEach((prevPlanet) => {
                const fullTransits = planet.getFullTransits(previousPlanets);
                const fullTransitsStar = planet.getFullTransits(starMenu.star);
                const fullPartialStar = planet.getFullTransits(starMenu.star);
                fullTransits.forEach((transit, index) => {
                    if (transit && (fullTransitsStar[index]) | (transit && fullPartialStar[index])) {
                        A[index] -= planet.Area; // Full transit area is the area of the planet
                    }   
                });
                
                const partialtransit = prevPlanet.getPartialTransits(planet);
                partialtransit.forEach((transit, index) => {
                    if (transit && (fullTransitsStar[index]) | (transit && fullPartialStar[index])) {
                        const beta = getBeta(prevPlanet._R, planet._R, planet.ry[index], planet.rz[index], prevPlanet.ry[index], prevPlanet.rz[index])
                        const alpha = getAlpha(prevPlanet._R, planet._R, beta)  
                        A[index] -= transitArea(prevPlanet._R, planet._R, beta, alpha);
                    }   

                });
                
            });
            /*Append planet to the previous planets*/
            previousPlanets[planetIndex] = planet;
    });
        const fraction = A.map((area) => 1 - area / starMenu.star.Area);
        console.log("fraction", fraction)
        const animatePlanets = () => {
            animate(starMenu.star, planetMenu.planets, ratio, fraction, lightcurveMenu.timesDays, datapoints); 
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
init();


