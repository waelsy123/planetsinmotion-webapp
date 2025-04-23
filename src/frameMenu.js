

export class FrameMenu {
    constructor(onUpdate) {
        this.onUpdate = onUpdate; // Callback to restart the simulation

        // Initialize menu elements
        this.initFrame()

    }

    initFrame() {
        const msInput = document.getElementById("ms");
        this.ms = parseInt(msInput.value);
        msInput.addEventListener("input", (event) => {
            this.ms = parseInt(event.target.value);
            this.onUpdate(); // Trigger simulation update
        });

        this.saveAnimationButton = document.getElementById("save-animation-btn");

    }

}
