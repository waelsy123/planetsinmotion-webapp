import { R_sun, M_J, M_sun } from './constants.js';
import { Planet, PlanetDimensionsError, StarPlanetDistanceError } from './planet.js';
import { linspace, } from './utils.js';
import { ToolTipLabel } from './toolTipLabel.js';
import { timeDays } from 'd3';

const iconPlanetsize = 15

export class PlanetMenu {
    constructor(onUpdate, onMenuOpened, onMenuClosed, star) {
        this.onUpdate = onUpdate; // Callback to restart the simulation
        this.onMenuOpened = onMenuOpened;
        this.onMenuClosed = onMenuClosed;
        this.planets = [];
        this.star = star;
        // Initialize menu elements

        this.defaultColor = document.getElementById("planet-period").style.color
        this.supressedListener = false
        this.initPlanetMenu()
        //this.initCanvas()
        this.planetNameCounter = 0;

    }


    setLanguage(translations) {

        this.labels.forEach(label => {
            label.setLanguage(translations)
        });

    }
    /**
     * This method is just in case we want add zoom capabilities, otherwise ignore
     */
    initCanvas() {
        const canvas = document.getElementById("planet-canvas");

        this.translatePos = {
            x: canvas.width / 2,
            y: canvas.height / 2
        };

        this.scale = 1.0;
        this.scaleMultiplier = 0.8;
        this.startDragOffset = {};

        // add button event listeners
        document.getElementById("plus").addEventListener("click", () => {
            this.scale /= this.scaleMultiplier;
            this.updateCanvas();
        }, false);

        document.getElementById("minus").addEventListener("click", () => {
            this.scale *= this.scaleMultiplier;
            this.updateCanvas();
        }, false);
    }

    initPlanetMenu() {
        /* Buttons from the main window */
        this.addPlanetBtn = document.getElementById("add-planet-btn");
        this.addPlanetBtn.addEventListener("click", () => this.showPlanetForm());

        this.planetForm = document.getElementById("planet-form");

        /* Buttons from the pop up window */
        this.cancelPlanetBtn = document.getElementById("cancel-planet-btn");
        this.cancelPlanetBtn.addEventListener("click", () => {
            this.closePlanetForm()
            this.onMenuClosed();
        });
        this.closePlanetBtn = document.getElementById("close-planet-btn");
        this.closePlanetBtn.addEventListener("click", () => this.cancelPlanetBtn.click());

        this.planetList = document.getElementById("planet-list");

        /* Error message for the add planet menu*/
        this.errorLabel = document.getElementById("planet-error")

        /* Inputs for the pop up menu */
        // Orbit
        this.planetNameInput = document.getElementById("planet-name")
        this.periodInput = document.getElementById("planet-period")
        this.iInput = document.getElementById("inclination-input")
        this.phaseInput = document.getElementById("phase-input")
        this.Omega0Input = document.getElementById("longitude-ascending-node-input")
        this.eInput = document.getElementById("eccentricity-input")

        // Planet
        this.massInput = document.getElementById("planet-mass")
        this.radiusInput = document.getElementById("planet-radius")
        this.colorInput = document.getElementById("planet-color")

        const inputs = [this.periodInput, this.iInput, this.eInput, this.massInput, this.radiusInput, this.phaseInput, this.Omega0Input]

        /* Add min max functionality */
        inputs.forEach(input => {
            input.addEventListener("input", (event) => {
                const min = parseFloat(event.target.min);
                const max = parseFloat(event.target.max);
                var value = parseFloat(event.target.value);

                if (value < min) {
                    value = min; // Reset to minimum
                    event.target.value = value
                } else if (value > max) {
                    value = max; // Reset to maximum
                    event.target.value = value
                }
                inputs.forEach(input => {
                    input.style.color = this.defaultColor
                });
                this.errorLabel.classList.add("hidden");
                
                if (this.supressedListener) return;
                this.createPlanet();
                this.updateCanvas()
            });
        });

        this.colorInput.addEventListener("input", (event) => {
            // This prevents randomize from triggering the event
            if (this.supressedListener) return;
            console.log("Input Triggered")

            this.createPlanet();
            this.updateCanvas();
        });

        this.planetNameInput.addEventListener("input", (event) => {

            event.target.style.color = this.defaultColor;
            this.errorLabel.classList.add("hidden");
        });


        //const logscaleInput = document.getElementById("planet-form-log-scale")
        /* 
        logscaleInput.addEventListener("click", (event) => {
            this.logscale = event.target.checked
            console.log("logscale " + event.target.checked)
            this.updateCanvas()
        });

        */
        this.randomizeBtn = document.getElementById("randomize-planet-btn");

        this.randomizeBtn.addEventListener("click", () => {
            // do not update the orbit with each parameter change, only at the end
            this.supressedListener = true
            //Randomize inputs
            this.randomizeInputs()

            this.errorLabel.classList.remove("hidden")
            this.createPlanet();
            this.updateCanvas()
            // activate the listeners back
            this.supressedListener = false
        });


        // Tooltip elements
        const OmegaLabel = new ToolTipLabel("longitude-ascending-node")
        const phaseLabel = new ToolTipLabel("phase")
        const eccentricityLabel = new ToolTipLabel("eccentricity")
        const inclinationLabel = new ToolTipLabel("inclination")

        this.labels = [OmegaLabel, phaseLabel, eccentricityLabel, inclinationLabel]

        // Planet counter
        this.planetCounter = document.getElementById("planet-title-number")

    }
    /**
     * Attempts to create a new planet with the given parameters. Highlights error if any
     * @param {number} M - Mass of the planet.
     * @param {number} R - Radius of the planet.
     * @param {number} P - Orbital period of the planet.
     * @param {number} i - Inclination of the orbit.
     * @param {number} e - Eccentricity of the orbit.
     * @param {number} phase - Initial phase of the orbit.
     * @param {number} Omega0 - Longitude of the ascending node.
     * @param {string} color - Color of the planet.
     * @param {string} name - Name of the planet.
     * @returns {boolean} - True if the planet was created successfully, false otherwise.
     */
    createPlanet() {
        const M = parseFloat(this.massInput.value);
        const R = parseFloat(this.radiusInput.value);
        const P = parseFloat(this.periodInput.value);
        const i = parseFloat(this.iInput.value);
        const e = parseFloat(this.eInput.value);
        const phase = parseFloat(this.phaseInput.value);
        const Omega0 = parseFloat(this.Omega0Input.value);
        const color = this.colorInput.value
        const name = this.planetNameInput.value

        try {
            this.planet = new Planet(M, R, P, this.star, i, e, 0, Omega0, phase, color, name);
            this.errorLabel.classList.add("hidden")
            return true
        } catch (error) {
            if (error instanceof StarPlanetDistanceError) {
                console.error(`Star-Planet Distance Error: ${error.message}`);
                this.errorLabel.classList.remove("hidden")
                this.errorLabel.textContent = "Orbit is whithin the star radius!"
                this.planet = null
                return false
            } else if (error instanceof PlanetDimensionsError) {
                this.errorLabel.classList.remove("hidden")
                this.errorLabel.textContent = error.message
                this.planet = null
                return false
            } else {
                // Possibly because the inputs are just do nothing
                //this.errorLabel.classList.remove("hidden")
                //this.errorLabel.textContent = error.message
                this.planet = null
                return false
            }
        }
    }

    updateCanvas(nOrbitTimes = 5000) {
        if (this.planet != null) {
            const times = linspace(0, this.planet._P, Math.floor(((this.planet.e + 0.01 ) * ntimes)));
            this.planet.setOrbitingTimes(times);
            this.drawOrbit();
            this.drawLightcurve()
        }
    }

    drawLightcurve() {
        const A = this.planet.getEclipsedArea(this.star);
        const fraction = A.map(area => 1 - area /this.star.Area());
        const canvas = document.getElementById("lightcurve-canvas-planet-form");
        const widthRatio = canvas.width / 2 / (fraction);
        const lenghtRatio = canvas.length / 2 / (this.timeDays);
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.save()

        ctx.beginPath();
        ctx.lineWidth = 1.5
        ctx.moveTo(this.timeDays[0] * widthRatio, fraction[0] * lenghtRatio);
        for (let i = 0; i < times.length; i++) {
            ctx.lineTo(this.timeDays[i] * widthRatio, fraction[i] * lenghtRatio);
        }
    }

    drawOrbit() {
        const canvas = document.getElementById("planet-canvas");

        const ctx = canvas.getContext("2d");

        const ratio = canvas.width / 2 / (this.planet.maxCoordinate() * 1.1);

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        ctx.save()
        if (this.star.rx[0] < this.planet.rx[0]) {
            this.star.draw(ctx, [canvas.width / 2, canvas.height / 2], ratio, 0, true)
            this.planet.draw(ctx, [canvas.width / 2, canvas.height / 2], ratio, 0, true)

        } else {
            this.planet.draw(ctx, [canvas.width / 2, canvas.height / 2], ratio, 0, true)
            this.star.draw(ctx, [canvas.width / 2, canvas.height / 2], ratio, 0, true)
        }
        ctx.beginPath();
        ctx.lineWidth = 1.5
        ctx.setLineDash([5, 10]);
        ctx.moveTo(this.planet.ry[0] * ratio + canvas.width / 2, this.planet.rx[0] * ratio + canvas.height / 2);
        for (let i = 0; i < times.length; i++) {
            ctx.lineTo(this.planet.ry[i] * ratio + canvas.width / 2, this.planet.rx[i] * ratio + canvas.height / 2);
        }

        ctx.closePath();
        ctx.strokeStyle = this.planet.color;
        ctx.stroke();
        ctx.restore();
    }

    showPlanetForm(index = null) {

        this.onMenuOpened();

        /* Button to add planet*/

        // This listener is dynamic because of the index so needs to be done in each call to the menu
        this.savePlanetBtn = document.getElementById("save-planet-btn");
        this.savePlanetListener = () => this.addPlanet(index);
        this.savePlanetBtn.addEventListener("click", this.savePlanetListener);

        this.planetForm.classList.remove("hidden");
        this.planetForm.focus()


        /*Fill in the value if we come from edit button*/
        if (index != null) {
            console.log("Editing planet " + index)

            this.savePlanetBtn.textContent = "Edit"

            // do not update the orbit with each parameter change, only at the end
            this.supressedListener = true

            this.planetNameInput.value = this.planets[index].planetName
            this.periodInput.value = this.planets[index].P
            this.eInput.value = this.planets[index].e
            this.iInput.value = parseFloat(this.planets[index].i).toFixed(2)
            this.Omega0Input.value = parseFloat(this.planets[index].Omega0).toFixed(2)
            this.massInput.value = this.planets[index].M
            this.phaseInput.value = this.planets[index].phase0
            this.radiusInput.value = this.planets[index].R
            this.colorInput.value = this.planets[index].color;

        } else {
            this.colorInput.value = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
            this.savePlanetBtn.textContent = "Add";
            this.planetNameInput.value = "Planet " + (this.planetNameCounter + 1);
        }

        this.createPlanet();
        this.updateCanvas()
        this.supressedListener = false

        // Keyboard listeners
        this.keydownListener = (event) => {
            if (event.key === "Escape") {
                this.closePlanetBtn.click();
            }

            else if (event.key == "Enter") {
                const active = document.activeElement;

            // Prevent interference from inputs like color pickers or text fields
            if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
                // Optional: only override if it's a color input
                if (active.type === "color") {
                    event.preventDefault(); // Stop the default color picker submit
                    event.stopPropagation();
                }
            }
                this.savePlanetBtn.click();
            }

            else if ((event.key=="R") || (event.key=="r")) {
                if (document.activeElement != this.planetNameInput) {
                    this.randomizeBtn.click();
                }
            }

            else if ((event.key=="c") || (event.key=="C")) {
                if (document.activeElement != this.planetNameInput) {
                        this.cancelPlanetBtn.click();
                }
            }
        };

        document.addEventListener('keydown', this.keydownListener);

    }

    randomizeInputs() {

        const randomNumber = Math.random();
        // Planet
        this.massInput.value = parseFloat(randomNumber * 100 * M_J / M_sun + M_J / M_sun).toFixed(2);
        this.radiusInput.value = parseFloat((randomNumber * this.star.R / R_sun / 5) + 1).toFixed(2);

        // Orbit
        this.periodInput.value = Math.floor(randomNumber * 500) + 0.01
        this.iInput.value = parseFloat((2 * randomNumber - 1) * 89.9).toFixed(2);
        const randome = Math.random();
        this.eInput.value = parseFloat(randome.toFixed(2));
        const randomPhase = Math.random();
        this.phaseInput.value = randomPhase.toFixed(2);
        const randomOmega0 = Math.random();
        this.Omega0Input.value = randomOmega0.toFixed(2);
    }

    closePlanetForm() {
        console.log("Closing Menu")
        // Blur the active element (e.g., color picker input)
        if (document.activeElement) {
            document.activeElement.blur();
        }
        // Hide form
        this.planetForm.classList.add("hidden");

        // Remove listeners
        if (this.keydownListener) {
            document.removeEventListener("keydown", this.keydownListener);
            this.keydownListener = null; // Clear the reference
        }
        this.savePlanetBtn.removeEventListener("click", this.savePlanetListener);

        if (this.savePlanetListener) {
            this.savePlanetListener = null
        }

    }
    /**
     * Adds a planet to the list of planets when the user press the button. If index is null, it adds a new planet.
     * If index is provided, it updates the existing planet at that index.
     * @param {number} index - The index of the planet to update (optional).
     */
    addPlanet(index = null) {

        const name = this.planetNameInput.value
        const planetNames = this.planets.map(planet => planet.planetName);
        const existingIndex = planetNames.indexOf(name);
        // Check if the planet name already exists in the list
        // If the planet name already exists and it's not the same planet being edited, show an error
        if (existingIndex!= -1 && existingIndex!=index) {
            this.errorLabel.classList.remove("hidden");
            this.errorLabel.textContent = "Planet name already exists!";
            this.planetNameInput.style.color = "red";
            this.planetNameInput.focus();
            this.planet = null;
            return;
        }
        
        // Errors are handled by createPlanet so no need to do anything here
            const success = this.createPlanet() // possibly no need but just in case
            if (success) {
                /* If planet did not exist */
                if (index == null) {
                    this.planets.push(this.planet)
                    this.planetNameCounter++;

                } else {
                    /* If existed update the list */
                    this.planets[index] = this.planet
                }
                
            this.closePlanetForm();
            this.updateParameters();
        }
    }

    createPlanetButton(image, listener, alt) {
        const button = document.createElement("button");
        button.className = "planet-btns"
        const buttonIcon = document.createElement("img")
        buttonIcon.setAttribute("src", image);
        // Apply a white color to the icon using CSS filter
        buttonIcon.setAttribute("alt", alt);
        buttonIcon.setAttribute("title", alt)
        button.addEventListener("click", listener);
        button.appendChild(buttonIcon)
        return button

    }

    onRemoveListener(index) {
        console.log("Removing planet" + index)
        this.planets.splice(index, 1);
        this.updateParameters();
    }

    onEditListener(index) {
        console.log("Editing planet " + index)
        this.showPlanetForm(index)
    }

    updateParameters() {
        this.maxRadius = Math.max(...this.planets.map(planet => planet.R));
        this.maxP = Math.max(...this.planets.map(planet => planet._P));
        this.updatePlanetList()
    }


    // Update the planet list UI
    updatePlanetList() {

        this.planetList.innerHTML = ""; // Clear the list

        this.planets.forEach((planet, index) => {
            const planetItem = document.createElement("div");
            planetItem.className = "planet-item";
            /* Create dot */
            const dotContainer = document.createElement("div");
            dotContainer.className = "dot-planet-container";

            // Create the dot
            const colorCircle = document.createElement("span");
            colorCircle.className = "dot-planet";
            colorCircle.style.backgroundColor = planet.color;

            /* Rescale width and height of the circle */
            const width = planet.R * iconPlanetsize / this.maxRadius
            colorCircle.style.width = width.toString() + "px";
            colorCircle.style.height = width.toString() + "px";

            dotContainer.appendChild(colorCircle);

            const planetName = document.createElement("span");
            planetName.textContent = planet.planetName;
            /*edit button */

            const editButton = this.createPlanetButton("../icons/edit.png", () => this.onEditListener(index),
                "Edit")

            /* remove button */
            const deleteButton = this.createPlanetButton("../icons/delete-button.svg", () => this.onRemoveListener(index),
                "Delete")

            planetItem.appendChild(colorCircle);
            planetItem.appendChild(planetName);
            planetItem.appendChild(editButton);
            planetItem.appendChild(deleteButton);

            this.planetList.appendChild(planetItem);
        });


        this.planetCounter.textContent = "Planets (" + this.planets.length + ")";
        /* Trigger the update of the simulation */
        this.onUpdate()
    }

    setTimes(times) {
        this.planets.forEach(planet => {
            planet.setOrbitingTimes(times);
        });
        /* Max distance depends on the orbits and therefore we need the times*/
        this.maxDistance = Math.max(...this.planets.map(planet => (planet.maxCoordinate() + planet._R)));
    }

    setStar(star) {
        this.star = star
        this.planets.forEach(planet => {
            planet.setStar(star);
        });
    }
}
