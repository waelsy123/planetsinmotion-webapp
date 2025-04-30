import * as d3 from "d3";
export class CanvasHandler {

    constructor(id, width, height, margins) {
        this.margin = margins;
        this.width = width - this.margin.left - this.margin.right;
        this.height = height - this.margin.top - this.margin.bottom;
        this.units = 1

        // Append the SVG object to the container
        this.svgRoot = d3
            .select("#" + id)
            .append("svg").attr("style:cursor", "pointer").attr("class", "canvas")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            
            
        this.svg = this.svgRoot.append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
    }


    setDomains(minx, maxx, miny, maxy, inverty = false) {
        this.svg.selectAll(".axis").remove();

        const domainx  = [minx/this.units, maxx/ this.units]
        const domainy = [miny/this.units, maxy/ this.units]

        // Create the x-axis scale (time in days)
        this.xScale = d3
        .scaleLinear()
        .domain(domainx).nice(80) // Input domain
        .range([0, this.width]); // Output range

        const rangey = inverty ? [0, this.height] : [this.height, 0]
        // Create the y-axis scale (relative flux)
        this.yScale = d3
            .scaleLinear()
            .domain(domainy).nice(80)
            .range(rangey);
        
        // Common inline style for all axes
        const applyAxisStyles = (axisGroup) => {
            axisGroup.selectAll("path, line")
                .attr("stroke", "white")
                .attr("stroke-width", 2)
                .attr("shape-rendering", "crispEdges");

            axisGroup.selectAll("text")
                .attr("fill", "white")
                .attr("font-size", "22px")
                .attr("font-family", "DejaVu Sans");
        };

        // Bottom x-axis
        const bottomAxis = this.svg.append("g")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(this.xScale).tickSize(14).ticks(6)).attr("class", "axis");
        applyAxisStyles(bottomAxis);

        // Left y-axis
        const leftAxis = this.svg.append("g")
            .call(d3.axisLeft(this.yScale).tickSize(14).ticks(6)).attr("class", "axis");
        applyAxisStyles(leftAxis);

        // Top x-axis
        const topAxis = this.svg.append("g")
            .attr("transform", `translate(0,0)`)
            .call(d3.axisTop(this.xScale).tickValues([])).attr("class", "axis");
        applyAxisStyles(topAxis);

        // Right y-axis
        const rightAxis = this.svg.append("g")
            .attr("transform", `translate(${this.width},0)`)
            .call(d3.axisRight(this.yScale).tickValues([])).attr("class", "axis");
        applyAxisStyles(rightAxis);

    }

    setScales(xvalues, yvalues) {

    }


    clear() {

        this.xScale = null
        this.yScale = null
        this.svg.selectAll(".axis").remove();
    }

}