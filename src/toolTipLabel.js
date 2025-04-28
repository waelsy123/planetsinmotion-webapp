export class ToolTipLabel {
    constructor(name) {

        this.name = name

        this.toolTipElement = document.getElementById("tooltip-" + name)

    }


    setLanguage(translations) {
        this.toolTipElement.innerText = translations[this.name + "_tooltip"];
    }

}