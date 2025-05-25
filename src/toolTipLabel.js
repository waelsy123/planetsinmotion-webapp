export class ToolTipLabel {
    constructor(name) {

        this.name = name;

        this.toolTipElement = document.getElementById("tooltip-" + name);

        if (this.toolTipElement==null) {
            console.warn("ToolTip tooltip-" + name + " not found");
        }

    }


    setLanguage(translations) {
        const toolTip = translations[this.name + "_tooltip"].replace("{index}", "{0}");
        //InnerHTML to allow for italics
        this.toolTipElement.innerHTML = toolTip;
    }

}