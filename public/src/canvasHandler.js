import * as d3 from "d3";
import fixWebmDuration from "fix-webm-duration";
import { downloadBlob } from './utils.js';

const DOMAIN_NAME = "planetsinmotion.live";

export class CanvasHandler {

    constructor(id, width, height, margins, outputname) {
        this.margin = margins;
        this.width = width - this.margin.left - this.margin.right;
        this.height = height - this.margin.top - this.margin.bottom;
        this.units = 1
        this.fontsize = 18

        // Append the SVG object to the container
        this.svgRoot = d3
            .select("#" + id)
            .append("svg").attr("style:cursor", "pointer").attr("class", "canvas")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            
            
        this.svg = this.svgRoot.append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        this.outputname = outputname
    }


    setDomains(minx, maxx, miny, maxy, inverty = false) {
        this.svg.selectAll(".axis").remove();

        const domainx  = [minx/this.units, maxx/ this.units]
        const domainy = [miny/this.units, maxy/ this.units]

        // Create the x-axis scale (time in days)
        this.xScale = d3
        .scaleLinear()
        .domain(domainx) // Input domain
        .range([0, this.width]); // Output range

        const rangey = inverty ? [0, this.height] : [this.height, 0]
        // Create the y-axis scale (relative flux)
        this.yScale = d3
            .scaleLinear()
            .domain(domainy)
            .range(rangey);
        
        // Common inline style for all axes
        const applyAxisStyles = (axisGroup) => {
            axisGroup.selectAll("path, line")
                .attr("stroke", "white")
                .attr("stroke-width", 2)
                .attr("shape-rendering", "crispEdges");

            axisGroup.selectAll("text")
                .attr("fill", "white")
                .attr("font-size", `${this.fontsize}px`)
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


    startRecording(ms, format, duration) {
        
        // Canvas for recording
        this.canvas = document.createElement("canvas");
        this.canvas.width = this.width * 2;
        this.canvas.height = this.height * 2;
        this.ctx = this.canvas.getContext("2d");
        this.ctx.font = `italic 32px DejaVu Sans`;
        this.ctx.strokeStyle = "white";
        this.ctx.lineWidth = 2;
        var recordedChunks = [];
        const stream = this.canvas.captureStream(ms);
        this.mediaRecorder = new MediaRecorder(stream, { mimeType: format });

        this.mediaRecorder.onstart = () => {

            console.log(`Recording for ${this.outputname} started and will stop after ${duration / 1000} seconds.`);
        };
        
    
        this.mediaRecorder.ondataavailable = (evt) => {
            if (evt.data.size > 0) {
                recordedChunks.push(evt.data);
            }
        };
    
        this.mediaRecorder.onstop = async () => {
            const blob = new Blob(recordedChunks, { type: format });
            const fixedBlob = await fixWebmDuration(blob, duration);
            downloadBlob(fixedBlob, this.outputname, "webm");
            //this.mediaRecorder = null;
            this.canvas = null;
            this.ctx = null
        };
    
        this.mediaRecorder.start();
    }


    updateRecording() {
        const svgData = new XMLSerializer().serializeToString(this.svgRoot.node());
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
            this.ctx.strokeText(DOMAIN_NAME, this.canvas.width - 500, this.canvas.height - 100);
            URL.revokeObjectURL(url);
        };
    
        img.src = url;
    }


    stopRecording() {
        if (this.mediaRecorder.state === "recording") {
            this.mediaRecorder.stop();
        }
    }
    

}