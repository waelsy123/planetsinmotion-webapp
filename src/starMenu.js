import { Star } from './star.js';


export class StarMenu {
    constructor(onStarUpdate, onColorChange) {
        this.onStarUpdate = onStarUpdate; // Callback when star parameters are changed
        this.onColorChange = onColorChange; // Callback to change star color
        // Initialize menu elements
        this.initStar();
    }

    initStar() {
        const starMassInput = document.getElementById("star-mass");
        const starRadiusInput = document.getElementById("star-radius");
        const starColorSelect = document.getElementById("star-color");
        const starIcon = document.getElementById("star-icon");

        starIcon.addEventListener("click", () => {
            starColorSelect.click(); // Open color picker when icon is clicked
        });
        
        // Add listeners for star inputs
        starMassInput.addEventListener("input", (event) => {
            const newMass = parseFloat(event.target.value);
                this.star.M = newMass;
                this.onStarUpdate(); // Trigger simulation update
        });

        starRadiusInput.addEventListener("input", (event) => {
            const newRadius = parseFloat(event.target.value);
                this.star.R = newRadius;
                this.onStarUpdate(); // Trigger simulation update
        });

        starColorSelect.addEventListener("change", (event) => {
            this.star.color = event.target.value;
            starIcon.style.backgroundColor = event.target.value

            this.onColorChange(); // Trigger simulation update
        });

        this.star = new Star(starMassInput.value, starRadiusInput.value, starColorSelect.value);
        starIcon.style.backgroundColor = this.star.color

    }


    setTimes(times) {
        this.star.setOrbitingTimes(times);
        }

}
