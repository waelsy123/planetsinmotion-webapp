import * as d3 from "d3";
import { CanvasHandler } from "./canvasHandler";
export class LightcurveHandler extends CanvasHandler {

    constructor(id, width, height, margins) {
        super(id, width, height, margins, "lightcurve")
        this.xvalues = null
        this.yvalues = null
    }

    drawLightcurved3(color, j) {
        // Limit the data to the j index
        const limitedTimesDays = this.xvalues.slice(0, j + 1); // Include data up to index j
        const limitedFraction = this.yvalues.slice(0, j + 1); // Include data up to index j
        const data = limitedTimesDays.map((d, i) => ({ x: d, y: limitedFraction[i] }));
        // Create the line generator
        const line = d3
            .line()
            .x((d) => this.xScale(d.x)) // Map x values
            .y((d) => this.yScale(d.y)); // Map y values
        
        const path = this.svg.select(".line")

        if (true) {
        // Add the line to the SVG
        if (!path.empty()) {
            // Update the existing line
            path.datum(data).attr("d", line);
        } else {
            // Add the line for the first time
            this.svg
                .append("path")
                .datum(data) // Bind the data
                .attr("class", "line")
                .attr("d", line)
                .attr("stroke", color) // Set the line color
                .attr("stroke-width", 2); // Set the line width
            
        }
    }  else { 
        const limitedScatterTimesDays = this.xvalues.slice(j, j + 1); // Include data up to index j
        const limitedScatterFraction = this.yvalues.slice(j, j + 1); // Include data up to index j
        const scatterdata = limitedScatterTimesDays.map((d, i) => ({ x: d, y: limitedScatterFraction[i]}));
        this.svg.append('g')
        .selectAll("dot")
        .data(scatterdata)
        .enter()
        .append("circle")
          .attr("cx", d => this.xScale(d.x))
          .attr("cy", d => this.yScale(d.y))
          .attr("r", 5)
          .style("fill", color)

    }
}

    setScales(xvalues, yvalues) {
        super.setDomains(d3.min(xvalues), d3.max(xvalues), d3.min(yvalues) * 0.999, d3.max(yvalues) * 1.01)
        this.xvalues = xvalues
        this.yvalues = yvalues   
    }

    clear() {
        super.clear()
        //this.svg.selectAll("circle").remove();

        this.svg.select(".line").remove();
        this.xvalues = null
        this.yvalues = null
    }

}