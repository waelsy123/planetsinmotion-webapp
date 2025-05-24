
export class InfoDisplay {
    constructor(contentName) {
        this.activateButton = document.getElementById(contentName + "-button");
        // Initialize menu elements
        const content = document.getElementById(contentName +"-content")
        
        this.activateButton.addEventListener("click", () => {
            this.showContent(content, contentName)
        });
        this.closeButton = document.getElementById("close-" + contentName + "-btn");


        this.closeWindowListener = () =>{
            this.closeWindow(content);
        }
        this.closeButton.addEventListener("click", this.closeWindowListener);

        this.contentName = contentName;

    }

    setLanguage(language) {
        const body = document.getElementById(this.contentName + "-text");
        console.log("Setting language for " + this.contentName);
        body.innerHTML = language[this.contentName + "-text"];
    }


async showContent (content, contentName) {
    console.log("Showing " + contentName)
    content.classList.remove("hidden")
    content.focus()
    // Keyboard listeners
    this.keydownListener = (event) => {
    if (event.key === "Escape") {
        this.closeWindow(content);
    }
    } /* end of listener */
    document.addEventListener('keydown', this.keydownListener);


}

closeWindow(content) {
    content.classList.add("hidden")
    content.blur()
    if (this.keydownListener) {
        document.removeEventListener("keydown", this.keydownListener);
        this.keydownListener = null; // Clear the reference
    } 
}


}