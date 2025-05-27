
import { CanvasHandler } from "./canvasHandler";
import { AU } from "./constants";
import { Star } from "./star";
import {darkenColor} from './utils.js';
import * as d3 from "d3";

export class OrbitAnimatorCanvasHandler extends CanvasHandler {

    constructor(id, outputname, width = 600, height = 600, margins = { top: 20, bottom: 40, left: 60, right: 40 }) {
        super(id, width, height, margins, outputname)

        this.units = AU
    }

    defineSunGradient(starColor) {
        this.starColor = starColor;
        this.svg.selectAll(".star-gradient").remove();
        this.svg.append("defs").attr("class", "star-gradient").append("radialGradient")
        .attr("id", "sun-glow-gradient")
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "58%")
        .selectAll("stop")
        .data([
            { offset: "0%", color: starColor},  // Center: original color
            { offset: "100%", color: "black" }  // Edge: darker shadow
        ])
        .enter()
        .append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);
    }

    clear() {
        super.clear()
        // Remove planets definitions
        this.svg.selectAll("circle").remove();
        // Remove planets definitions
        this.svg.selectAll(".planet-defs").remove();
        this.svg.selectAll("path").remove();
    }

    drawBodies(bodies, i, faceon = false) {

        this.svg.selectAll("circle").remove();
        this.svg.selectAll(".planet-defs").remove();
        //this.svg.selectAll(".arc").remove();

        bodies.forEach((body) => {
            const radius = (Math.abs(this.xScale(body._R) - this.xScale(0)) / this.units)

            let color;

            const x = body.ry[i] / this.units
            var y = 1 / this.units;
            var z = 1 / this.units;

            if (faceon) {
                y *= -body.rx[i];
                z *= body.rz[i];
            } else {
                y *= body.rz[i];
                z *= body.rx[i];
            }

            if (body instanceof Star) {
                // Gradient already defined in the constructor    
                color = "url(#sun-glow-gradient)"
            } else {
                
                const theta = Math.atan2(faceon ? -y: y, x) // account for the flip signed in x
                const cosTheta = Math.cos(theta);
                const sinTheta = Math.sin(theta);
                const r = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
                const sinPhi = z / r;
                
                //const phi = Math.acos(Math.sqrt(x ** 2 + y ** 2) / r);
                //const cosPhi = Math.cos(phi); // cosPhi determines the position of the shadow

                // For face-on view, the gradient is vertical
                const gradientStartX = 50 * (1 - cosTheta);
                const gradientStartY = 50 * (1 + sinTheta); // At theta = 90 degrees, this will be 100% (bottom)
                const gradientEndX = 50 * (1 + cosTheta);
                const gradientEndY = 50 * (1 - sinTheta);
                
                // Define the gradient
                // Gradient ID is unique for each planet and view (face-on or edge-on) otherwise there are conflicts
                const gradientId = `planet-gradient-${body.planetName.replace(/\s+/g, '')}-${faceon ? "faceon" : "edegeon"}`;
                // y = 100% is the bottom of the planet
                // x1 = x2 means no gradient in the horizontal direction
                
                const linearGradient = this.svg.append("defs").attr("class", "planet-defs").append("linearGradient").attr("id", gradientId)
                .attr("x1",`${gradientStartX}%`)
                .attr("y1",`${gradientStartY}%`)
                .attr("x2",`${gradientEndX}%`)
                .attr("y2", `${gradientEndY}%`) 

                linearGradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", body.color); // Bright color body.color
                linearGradient.append("stop")
                    .attr("offset", `${(1 - sinPhi) / 2  * 100}%`) // Shadow position based on cosPhi
                    .attr("stop-color", darkenColor(body.color, 85)); // Darkened color
                                     
                color = `url(#${gradientId})`

                /**
                const shadowArc = d3.arc()
                .innerRadius(0)
                .outerRadius(radius)
                .startAngle(0)
                .endAngle(2 * Math.PI);

                this.svg.append("path")
                    .attr("d", shadowArc())
                    .attr("transform", `translate(${planetX}, ${planetY})`)
                    .style("fill", body.color).attr("class", "arc");

                 */
                /**
                // account for the flip signed in x
                const theta = Math.atan2(y, -x)
                const r = Math.sqrt(x ** 2 + y ** 2 + z ** 2)
                const phi = Math.acos(Math.sqrt(x ** 2 + y ** 2) / r)
                const firstangle = ((Math.PI - theta)) // + Math.sign(z) * phi) + Math.PI / 2
                if (faceon) {
                   console.log("Theta", theta / Math.PI * 180, x, x.toFixed(2), "y", y.toFixed(2))
                    console.log("firstangle", firstangle/ Math.PI * 180)
            }
                const secondangle = ((2 * Math.PI - theta))// - Math.sign(z) * phi) + Math.PI / 2
                // this ensure the difference is negative, so we get counterclockwise for the shadow
                const startangle = Math.max(firstangle, secondangle) 
                const endangle = Math.min(firstangle, secondangle)


                //console.log(faceon, "startangle", (startangle / Math.PI * 180).toFixed(2), "endangle", (endangle / Math.PI * 180).toFixed(2))
                if (faceon) {
                console.log(startangle - endangle, "shadow", "clockwise")
                console.log("START ANGLE", startangle / Math.PI *180, "END ANGLE", endangle / Math.PI * 180)
            }
                const shadowArc = d3.arc()
                    .innerRadius(0)
                    .outerRadius(radius)
                    .startAngle(startangle)
                    .endAngle(endangle);

                this.svg.append("path")
                    .attr("d", shadowArc())
                    .attr("transform", `translate(${planetX}, ${planetY})`)
                    .style("fill", "blue").attr("class", "arc");
                    //.style("fill", darkenColor(body.color, 50)).attr("class", "arc"); //darkenColor(body.color, 50)
                    
                    //d3.color(body.color).darker(0.5)).attr("class", "arc");;

                // Bright side
                console.log(endangle - startangle, "Bright")
                const brightArc = d3.arc()
                    .innerRadius(0)
                    .outerRadius(radius)
                    .startAngle(endangle)
                    .endAngle(startangle)

                      */
            }

            const bodyX = this.xScale(x)
            const bodyY = this.yScale(y)
            // Add the circle
            this.svg.append("circle")
            .attr("pointer-events","none")
            .attr("cx", bodyX)
            .attr("cy", bodyY)
            .attr("r", radius)
            .style("fill", color);
            /** TODO implement atmosphere
            if (!(body instanceof Star)) {

                this.svg.append("circle")
                .attr("cx", bodyX)
                .attr("cy", bodyY)
                .attr("r", radius + 50) // Slightly larger than the planet
                .style("fill", color)
                .style("opacity", 0.6)
                .style("filter", "blur(5px)"); // Add blur for the glow

            }
             */

        });
    }


}