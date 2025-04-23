import { Star } from './star.js';


export class StarMenu {
    constructor(onUpdate) {
        this.onUpdate = onUpdate; // Callback to restart the simulation

        // Initialize menu elements
        this.initStar();
    }

    initStar() {
        const starMassInput = document.getElementById("star-mass");
        const starRadiusInput = document.getElementById("star-radius");
        const starColorSelect = document.getElementById("star-color");
        const starIcon = document.getElementById("star-icon");
        
        // Add listeners for star inputs
        starMassInput.addEventListener("input", (event) => {
            const newMass = parseFloat(event.target.value);
                this.star.M = newMass;
                this.onUpdate(); // Trigger simulation update
        });

        starRadiusInput.addEventListener("input", (event) => {
            const newRadius = parseFloat(event.target.value);
                this.star.R = newRadius;
                this.onUpdate(); // Trigger simulation update
        });

        starColorSelect.addEventListener("change", (event) => {
            this.star.color = event.target.value;
            starIcon.style.backgroundColor = event.target.value

            this.onUpdate(); // Trigger simulation update
        });

        this.star = new Star(starMassInput.value, starRadiusInput.value, starColorSelect.value);
        starIcon.style.backgroundColor = this.star.color

    }


    setTimes(times) {
        this.star.setOrbitingTimes(times);
        }

}
