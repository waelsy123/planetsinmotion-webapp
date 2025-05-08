import { ToolTipLabel } from "./toolTipLabel.js";

export class FrameMenu {
    constructor(onUpdate) {
        this.onUpdate = onUpdate; // Callback to restart the simulation

        // Initialize menu elements
        this.initFrame()

    }

    initFrame() {
        this.msInput = document.getElementById("ms");
        this.msLabel = new ToolTipLabel("frame-rate")
        this.ms = parseFloat(this.msInput.value);
        this.msInput.addEventListener("input", (event) => {
            this.ms = parseFloat(event.target.value);
            this.onUpdate(this.ms); // Trigger simulation update
        });

        this.saveAnimationButton = document.getElementById("save-animation-btn");
        this.saveAnimationButton.disabled = true;

        this.durationLabel = document.getElementById("animation-duration-label");
    }

    setDuration(duration) {
        this.durationLabel.innerHTML = (duration / 1000).toFixed(3);
        this.animationDurationms = duration;
    }


    setLanguage(translations) {
        this.msLabel.setLanguage(translations);
    }
    
    disable(disable) {
        this.msInput.disabled = disable;
        this.saveAnimationButton.disabled = disable;
    }

    

}
