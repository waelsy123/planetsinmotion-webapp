import { Planet, StarPlanetDistanceError } from './planet.js';

const iconPlanetsize = 15

export class PlanetMenu {
    constructor(onUpdate, star) {
        this.onUpdate = onUpdate; // Callback to restart the simulation
        this.planets = []
        this.star = star
        // Initialize menu elements
        /*this.createPlanets(star);*/

        this.defaultColor = document.getElementById("planet-period").style.color

        this.initPlanetMenu()
    }

    initPlanetMenu() {
        /* Buttons from the main window */
        this.addPlanetBtn = document.getElementById("add-planet-btn");
        this.addPlanetBtn.addEventListener("click", () => this.showPlanetForm());

        this.planetForm = document.getElementById("planet-form");
        
        /* Buttons from the pop up window */
        this.cancelPlanetBtn = document.getElementById("cancel-planet-btn");
        this.cancelPlanetBtn.addEventListener("click", () => this.closePlanetForm());
        this.closePlanetBtn = document.getElementById("close-planet-btn");
        this.closePlanetBtn.addEventListener("click", () => this.closePlanetForm());
        
        this.planetList = document.getElementById("planet-list");

        /* Error message for the add planet menu*/
        this.errorLabel = document.getElementById("planet-error")


        /* Listeners for the pop up menu */
        const periodInput = document.getElementById("planet-period")
        const iInput = document.getElementById("inclination")
        const eInput = document.getElementById("eccentricity")
        const massInput = document.getElementById("planet-mass")
        const radiusInput = document.getElementById("planet-radius")

        const inputs = [periodInput, iInput, eInput, massInput, radiusInput]
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
        });});

    }


    showPlanetForm(index=null) {

        /* Button to add planet*/
        this.savePlanetBtn = document.getElementById("save-planet-btn"); 
        this.savePlanetListener = () => this.addPlanet(index);
        this.savePlanetBtn.addEventListener("click", this.savePlanetListener);

        this.planetForm.classList.remove("hidden");
        this.planetForm.focus()
        this.editingIndex = null; // Reset editing state
        const planetNameInput = document.getElementById("planet-name")
        const colorInput = document.getElementById("planet-color")

        /*Fill in the value if we come from edit button*/
        if (index!=null) {
            console.log("Editing planet " + index)
            const periodInput = document.getElementById("planet-period")
            const iInput = document.getElementById("inclination")
            const eInput = document.getElementById("eccentricity")
            const massInput = document.getElementById("planet-mass")
            const radiusInput = document.getElementById("planet-radius")
            

            this.savePlanetBtn.textContent = "Edit"
            planetNameInput.value = this.planets[index].planetName
            periodInput.value =  this.planets[index].P
            eInput.value =  this.planets[index].e
            iInput.value = this.planets[index].i
            massInput.value = this.planets[index].M
            radiusInput.value = this.planets[index].R
            colorInput.value = this.planets[index].color;

        } else {
            colorInput.value = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
            this.savePlanetBtn.textContent = "Add"
            planetNameInput.value = "Planet " + (this.planets.length + 1)
        }

        // Keyboard listeners
        this.keydownListener = (event) => {
            if (event.key === "Escape") {
                this.closePlanetForm();
            }

            if (event.key=="Enter") {
                this.savePlanetBtn.focus()
                this.addPlanet(index);
            }
        };

        document.addEventListener('keydown', this.keydownListener);


    }

    closePlanetForm() {
        this.savePlanetBtn.removeEventListener("click", this.savePlanetListener);
        this.planetForm.classList.add("hidden");
        if (this.keydownListener) {
            document.removeEventListener("keydown", this.keydownListener);
            this.keydownListener = null; // Clear the reference
        }
    }

    addPlanet(index=null) {
        const massInput = document.getElementById("planet-mass")
        const radiusInput = document.getElementById("planet-radius")
        const periodInput = document.getElementById("planet-period")
        const iInput = document.getElementById("inclination")
        const eInput = document.getElementById("eccentricity")
        const colorInput = document.getElementById("planet-color")
        const planetNameInput = document.getElementById("planet-name")
        
        
        const Mp = parseFloat(massInput.value)
        const Rp = parseFloat(radiusInput.value)
        const P = parseFloat(periodInput.value)
        const i = parseFloat(iInput.value)
        const e = parseFloat(eInput.value)
        const color = colorInput.value
        const planetName = planetNameInput.value
        
        try {
            const planet = new Planet(Mp, Rp, P, this.star, i, e, 0, 0, 0, color, planetName);
            /* If planet did not exist */
            if (index==null) {
                this.planets.push(planet)
            } else {
                this.planets[index] = planet
            }
            this.maxDistance = Math.max(...this.planets.map((planet) => (planet.rmax + planet._R)));
            this.maxRadius = Math.max(...this.planets.map((planet) => planet.R));

        } catch (error) {
            if (error instanceof StarPlanetDistanceError) {
                console.error(`Star-Planet Distance Error: ${error.message}`);
                radiusInput.style.color = "red"
                periodInput.style.color = "red"
                eInput.style.color = "red"
                /*Show error message*/
                this.errorLabel.classList.remove("hidden")
                this.errorLabel.textContent = "Orbit is whithin the star radius!"

                return
            } else {
                console.error(`Unexpected error: ${error.message}`);
                return
            }
        }

        this.closePlanetForm();
        this.updatePlanetList();
    }

createPlanetButton(image, listener, alt) {
    const button = document.createElement("button");
    button.className="planet-btns"
    const buttonIcon = document.createElement("img")
    buttonIcon.setAttribute("src", image);
   // Apply a white color to the icon using CSS filter
    buttonIcon.style.filter = "invert(100%)";
    buttonIcon.setAttribute("alt", alt);
    buttonIcon.setAttribute("title", alt)
    buttonIcon.style.width = "16px"; // Adjust the size of the icon
    buttonIcon.style.height = "16px";
    button.addEventListener("click", listener);
    button.appendChild(buttonIcon)
    return button

}

onRemoveListener(index) {
    this.planets.splice(index, 1);
    this.updatePlanetList();
}

onEditListener(index) {
    console.log("Editing planet " + index)
    this.showPlanetForm(index)
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
        
        const editButton = this.createPlanetButton("../icons/edit.png", ()=> this.onEditListener(index), 
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
    /* Trigger the update of the simulation */
    this.onUpdate()
    }

    setTimes(times) {
            this.planets.forEach((planet) => {
                planet.setOrbitingTimes(times);
    });
    }

    setStar(star) {
        this.star = star
        this.planets.forEach((planet) => {
            planet.setStar(star);
        });
    }       
}
