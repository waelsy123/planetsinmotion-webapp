import { R_sun, M_J, AU, DaysToSeconds } from './constants.js';
import { Planet, PlanetDimensionsError, StarPlanetDistanceError } from './planet.js';
import { getPeriod } from './orbits.js';
import { linspace, playBeep } from './utils.js';
import { ToolTipLabel } from './toolTipLabel.js';
import { Transit } from './transit.js';
import { Units } from './units.js';

const iconPlanetsize = 15;

export class PlanetMenu {
    constructor(onUpdate, onMenuOpened, onMenuClosed, star) {
        this.onUpdate = onUpdate; // Callback to restart the simulation
        this.onMenuOpened = onMenuOpened;
        this.onMenuClosed = onMenuClosed;
        this.planets = [];
        this.star = star.copy();

        // default values
        this.units = new Units("jupyter"); // Default unit for the planets
        this.setLabelUnits();
        this.planetNameCounter = 0;

        // Initialize menu elements
        this.defaultColor = document.getElementById("planet-period").style.color;
        this.supressedListener = false;
        this.initPlanetMenu();
        this.createPlanet(); // Create a default planet to avoid null references
        this.defaultPlanet = this.planet;
        //this.initCanvas()


    }


    setLanguage(translations) {

        this.labels.forEach(label => {
            label.setLanguage(translations);
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
    /**
     * Set the units to the radius and mass labels
     */
    setLabelUnits() {
        // unit labels
        const radiusLabel = document.getElementById("planet-radius-label");
        console.log("Setting units: " + this.units.symbol);
        radiusLabel.innerHTML = `Radius (R${this.units.symbol})`;
        const massLabel = document.getElementById("planet-mass-label");
        massLabel.innerHTML = `Mass (M${this.units.symbol})`;
    }

    initPlanetMenu() {

        /* Buttons from the main window */
        this.addPlanetBtn = document.getElementById("add-planet-btn");
        this.addPlanetBtn.addEventListener("click", () => this.showPlanetForm());

        this.planetForm = document.getElementById("planet-form");

        /* Buttons from the pop up window */
        this.cancelPlanetBtn = document.getElementById("cancel-planet-btn");
        this.cancelPlanetBtn.addEventListener("click", () => {
            this.closePlanetForm();
            this.onMenuClosed();
        });
        this.closePlanetBtn = document.getElementById("close-planet-btn");
        this.closePlanetBtn.addEventListener("click", () => this.cancelPlanetBtn.click());

        this.planetList = document.getElementById("planet-list");

        /* Error messages*/
        // for the add planet menu*/
        this.errorLabel = document.getElementById("planet-error");
        // for the no transit warning
        this.transitWarningLabel = document.getElementById("transit-error");


        /* Inputs for the pop up menu */
        // Orbit
        this.planetNameInput = document.getElementById("planet-name");
        this.periodInput = document.getElementById("planet-period");
        this.iInput = document.getElementById("inclination-input");
        this.phaseInput = document.getElementById("phase-input");
        this.Omega0Input = document.getElementById("longitude-ascending-node-input");
        this.eInput = document.getElementById("eccentricity-input");

        // Planet
        this.massInput = document.getElementById("planet-mass-input");
        this.radiusInput = document.getElementById("planet-radius-input");
        this.colorInput = document.getElementById("planet-color");

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
                this.updateCanvas();
            });
        });

        this.colorInput.addEventListener("input", () => {
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

        this.randomizeBtn = document.getElementById("randomize-planet-btn");

        this.randomizeBtn.addEventListener("click", () => {
            // do not update the orbit with each parameter change, only at the end
            this.supressedListener = true
            //Randomize inputs
            this.randomizeInputs();

            this.errorLabel.classList.remove("hidden")
            this.createPlanet();
            this.updateCanvas();
            // activate the listeners back
            this.supressedListener = false;
        });


        // Tooltip elements
        const OmegaLabel = new ToolTipLabel("longitude-ascending-node");
        const phaseLabel = new ToolTipLabel("phase");
        const eccentricityLabel = new ToolTipLabel("eccentricity");
        const inclinationLabel = new ToolTipLabel("inclination");
        const massLabel = new ToolTipLabel("planet-mass");
        const radiusLabel = new ToolTipLabel("planet-radius");

        this.labels = [OmegaLabel, phaseLabel, eccentricityLabel, inclinationLabel, massLabel, radiusLabel];

        // Planet counter
        this.planetCounter = document.getElementById("planet-title-number");

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
            this.planet = new Planet(M, R, P, this.star, i, e, 0, Omega0, phase, color, name, this.units);
            this.errorLabel.classList.add("hidden");
        } catch (error) {
            if (error instanceof StarPlanetDistanceError) {
                console.error(`Star-Planet Distance Error: ${error.message}`);
                this.errorLabel.classList.remove("hidden");
                this.errorLabel.textContent = "Orbit is whithin the star radius!";
                this.planet = null;
            } else if (error instanceof PlanetDimensionsError) {
                this.errorLabel.classList.remove("hidden");
                this.errorLabel.textContent = error.message;
                this.planet = null;
            } else {
                console.error(`Unknown error: ${error.message}`);
                // Possibly because the inputs are just do nothing
                this.planet = null;
            }
        }
    }

    updateCanvas(nOrbitTimes = 10000) {
        if (this.planet != null) {
            const datapoints = Math.floor(this.planet.e + 0.01 * (this.planet.P * nOrbitTimes));
            console.log("Updating canvas for " + this.planet.planetName + "with " + datapoints + " datapoints");
            const times = linspace(0, this.planet._P, datapoints);
            this.planet.setOrbitingTimes(times);
            this.star.setOrbitingTimes(times);
            this.drawOrbit();
            const transit = new Transit(this.star, this.planet);
            const timesDays = times.map(t => t / (DaysToSeconds));
            const fraction = transit.visibleFraction;
            this.drawLightcurve(fraction, timesDays);

            // Update labels
            document.getElementById("perihelion").innerText = (this.planet.rmin / AU).toFixed(3) + " AU";
            document.getElementById("aphelion").innerText = (this.planet.rmax / AU).toFixed(3) + " AU";
            document.getElementById("transit-depth").innerText = transit.transitDepth.toFixed(3);
            console.log("Transit duration", transit.transitDuration);
            const dt = (timesDays[1] - timesDays[0]);
            if (transit.transitDuration == 0) {
                this.transitWarningLabel.classList.remove("hidden");
            } else {
                this.transitWarningLabel.classList.add("hidden");
            }

            document.getElementById("transit-duration").innerText = (transit.transitDuration * dt).toFixed(3) + " days";
        }
    }

    drawLightcurve(fraction, timesDays) {
        const canvas = document.getElementById("lightcurve-canvas-planet-form");
        const ctx = canvas.getContext("2d");
        // Define the axis ranges
        const xMin = Math.min(...timesDays);
        const xMax = Math.max(...timesDays);
        const yMin = Math.min(...fraction) * 0.95;
        const yMax = Math.max(...fraction) * 1.05;

        // Map axis units to canvas units
        const mapXToCanvas = (x) => ((x - xMin) / (xMax - xMin)) * canvas.width;
        const mapYToCanvas = (y) => canvas.height - ((y - yMin) / (yMax - yMin)) * canvas.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.save()

        ctx.beginPath();
        ctx.lineWidth = 1.5
        ctx.strokeStyle = this.star.color;

        // first point
        const x1 = mapXToCanvas(timesDays[0]);
        const y1 = mapYToCanvas(fraction[0]);
        ctx.moveTo(x1, y1);

        for (let i = 1; i < timesDays.length; i++) {
            const x = mapXToCanvas(timesDays[i]);
            const y = mapYToCanvas(fraction[i]);
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
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
        for (let i = 0; i < this.planet.rx.length; i++) {
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

            this.savePlanetBtn.textContent = "Accept";

            // do not update the orbit with each parameter change, only at the end
            this.supressedListener = true

            this.planetNameInput.value = this.planets[index].planetName;
            this.periodInput.value = this.planets[index].P;
            this.eInput.value = this.planets[index].e;
            this.iInput.value = parseFloat(this.planets[index].i).toFixed(2);
            this.Omega0Input.value = parseFloat(this.planets[index].Omega0).toFixed(2);
            this.massInput.value = this.planets[index].M;
            this.phaseInput.value = this.planets[index].phase0;
            this.radiusInput.value = this.planets[index].R;
            this.colorInput.value = this.planets[index].color;

        } else {
            this.savePlanetBtn.textContent = "Add";

            this.periodInput.value = this.defaultPlanet.P;
            this.eInput.value = this.defaultPlanet.e;
            this.iInput.value = this.defaultPlanet.i.toFixed(2);
            this.Omega0Input.value = this.defaultPlanet.Omega0.toFixed(2);
            this.massInput.value = this.defaultPlanet.M;
            this.radiusInput.value = this.defaultPlanet.R;
            this.phaseInput.value = this.defaultPlanet.phase0;

            // populate the form with default values
            this.colorInput.value = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
            this.planetNameInput.value = "Planet " + (this.planetNameCounter + 1);
        }

        this.createPlanet();
        this.updateCanvas();
        this.supressedListener = false;

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

            else if ((event.key == "R") || (event.key == "r")) {
                if (document.activeElement != this.planetNameInput) {
                    this.randomizeBtn.click();
                }
            }

            else if ((event.key == "c") || (event.key == "C")) {
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
        // 100 jypyter masses is the max
        // https://www.google.com/search?q=known+exoplanets+plot&client=ubuntu&hs=pEH&sca_esv=6d30932b12437026&channel=fs&udm=2&biw=1472&bih=741&ei=HCszaIaDO7unhbIPsr2WmAg&ved=0ahUKEwiGgeuk7L6NAxW7U0EAHbKeBYMQ4dUDCBE&uact=5&oq=known+exoplanets+plot&gs_lp=EgNpbWciFWtub3duIGV4b3BsYW5ldHMgcGxvdEiHDVDXBVi0DHABeACQAQCYAckBoAHUBaoBBTAuMy4xuAEDyAEA-AEBmAICoALTAcICCBAAGBMYBxgewgIHEAAYgAQYE8ICBhAAGBMYHsICCBAAGBMYBRgemAMAiAYBkgcFMS4wLjGgB98GsgcDMi0xuAfMAQ&sclient=img#vhid=kPpXBSnE1JE7qM&vssid=mosaic
        // max mass is around 10, so 20 more than enough
        this.massInput.value = parseFloat((randomNumber + 1) * 20 * M_J / this.units.M).toFixed(2);
        // radius go up to about 25 RE but we want to make it look nicer
        // make it 5 times smaller than the star value + 1 solar radius
        this.radiusInput.value = parseFloat((randomNumber * this.star._R / this.units.R / 5) + R_sun / this.units.R).toFixed(2);
        const randome = Math.random();
        this.eInput.value = parseFloat(randome.toFixed(2));

        // Orbit
        const rmin = this.star._R + this.radiusInput.value * this.units.R;
        const a  = rmin / (1 - this.eInput.value);
        const minPeriod = getPeriod(this.star._M, this.massInput.value * this.units.M, a);

        console.log("Min period: " + (minPeriod / DaysToSeconds).toFixed(2) + " days");
        this.periodInput.value = Math.floor(randomNumber * 500 + minPeriod / DaysToSeconds);
        this.iInput.value = parseFloat((2 * randomNumber - 1) * 89.9).toFixed(2);
        
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
            this.savePlanetListener = null;
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
        if (existingIndex != -1 && existingIndex != index) {
            this.errorLabel.classList.remove("hidden");
            this.errorLabel.textContent = "Planet name already exists!";
            this.planetNameInput.style.color = "red";
            this.planetNameInput.focus();
            this.planet = null;
            return;
        }

        // Errors are handled by createPlanet so no need to do anything here
        if (this.planet != null) {
            /* If planet did not exist */
            if (index == null) {
                this.planets.push(this.planet);
                this.planetNameCounter++;

            } else {
                /* If existed update the list */
                this.planets[index] = this.planet;
            }

            this.closePlanetForm();
            this.updateParameters();
            playBeep();
        }
    }

    createPlanetButton(image, listener, alt) {
        const button = document.createElement("button");
        button.className = "planet-btns";
        const buttonIcon = document.createElement("img");
        buttonIcon.setAttribute("src", image);
        // Apply a white color to the icon using CSS filter
        buttonIcon.setAttribute("alt", alt);
        buttonIcon.setAttribute("title", alt);
        button.addEventListener("click", listener);
        button.appendChild(buttonIcon);
        return button;

    }

    onRemoveListener(index) {
        console.log("Removing planet" + index);
        this.planets.splice(index, 1);
        this.updateParameters();
    }

    onEditListener(index) {
        console.log("Editing planet " + index);
        this.showPlanetForm(index)
    }

    updateParameters() {
        this.maxRadius = Math.max(...this.planets.map(planet => planet.R));
        this.maxP = Math.max(...this.planets.map(planet => planet._P));
        this.updatePlanetList();
    }


    // Update the planet list UI
    updatePlanetList() {

        this.planetList.innerHTML = ""; // Clear the list

        this.planets.forEach((planet, index) => {
            const planetItem = this.createPlanetItem(planet, index);

            this.planetList.appendChild(planetItem);
        });


        this.planetCounter.textContent = "Planets (" + this.planets.length + ")";
        /* Trigger the update of the simulation */
        this.onUpdate();
    }
    /**
     * Create planet HTML item for the list
     * @param {} planet 
     * @param {*} index 
     * @returns 
     */
    createPlanetItem(planet, index) {
        const planetItem = document.createElement("div");
        planetItem.className = "planet-item";
        planetItem.dataset.name = planet.planetName; // Use dataset to track the planet name

        // Create dot
        // dot container so everything is aligned
        const dotContainer = document.createElement("div");
        dotContainer.className = "dot-planet-container";

        // create the dot
        const colorCircle = document.createElement("span");
        colorCircle.className = "dot-planet";
        colorCircle.style.backgroundColor = planet.color;
        // make it an input color picker
        const inputColor = document.createElement("input");
        inputColor.type = "color";
        inputColor.value = planet.color;

        inputColor.style.display = "none"; // Enable the color input
        colorCircle.addEventListener("click", () => {
            inputColor.click();
        });
        inputColor.addEventListener("input", (event) => {

            this.planets[index].color = event.target.value;
            colorCircle.style.backgroundColor = event.target.value;
        });


        // Rescale width and height of the circle
        const width = planet.R * iconPlanetsize / this.maxRadius;
        colorCircle.style.width = width.toString() + "px";
        colorCircle.style.height = width.toString() + "px";
        dotContainer.appendChild(colorCircle);

        colorCircle.appendChild(inputColor);

        const planetName = document.createElement("span");
        planetName.className = "planet-name-label";
        planetName.title = planet.planetName;
        planetName.textContent = planet.planetName;

        // Edit button
        const editButton = this.createPlanetButton("/icons/edit.png", () => this.onEditListener(index), "Edit");

        // Remove button
        const deleteButton = this.createPlanetButton("/icons/delete-button.svg", () => this.onRemoveListener(index), "Delete");

        planetItem.appendChild(dotContainer);
        planetItem.appendChild(planetName);
        planetItem.appendChild(editButton);
        planetItem.appendChild(deleteButton);

        return planetItem;
    }

    setTimes(times) {
        this.planets.forEach(planet => {
            planet.setOrbitingTimes(times);
        });
        /* Max distance depends on the orbits and therefore we need the times*/
        this.maxDistance = Math.max(...this.planets.map(planet => (planet.maxCoordinate() + planet._R)));
    }

    setStar(star) {
        this.star = star.copy();
        this.planets.forEach(planet => {
            planet.setStar(star);
        });
    }
}
