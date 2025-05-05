
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
        this.closeButton.addEventListener("click", this.closeWindowListener)

    }


async showContent (content, contentName) {
    console.log("Showing " + contentName)
    content.classList.remove("hidden")
    content.focus()
    try {
        // Fetch the content from the external HTML file
        const response = await fetch(contentName + ".html");
        if (!response.ok) throw new Error("Failed to load About content");

        const textContent = await response.text();
        const textHolder = document.getElementById(contentName + "-text")
        textHolder.innerHTML = textContent
    } catch (error) {
        console.error(error);
        content.innerHTML = "<p>Failed to load" + contentName + " content.</p>";
    }
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