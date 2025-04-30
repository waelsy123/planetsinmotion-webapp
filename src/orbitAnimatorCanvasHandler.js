
import { CanvasHandler } from "./canvasHandler";
import { AU } from "./constants"
import * as d3 from "d3";
import { Star } from "./star"
import {darkenColor} from './utils.js'

export class OrbitAnimatorCanvasHandler extends CanvasHandler {

    constructor(id, width = 600, height = 600, margins = { top: 20, bottom: 40, left: 40, right: 40 }) {
        super(id, width, height, margins)

        this.units = AU
    }

    clear() {
        super.clear()
        this.svg.selectAll(".circle").remove();
        this.svg.selectAll("defs").remove();
        this.svg.selectAll("path").remove();
    }


    drawBodies(bodies, i, faceon = false) {

        this.svg.selectAll(".circle").remove();
        this.svg.selectAll("defs").remove();
        this.svg.selectAll(".arc").remove();


        bodies.forEach((body) => {

            const radius = (Math.abs(this.xScale(body._R) - this.xScale(0)) / this.units)

            let color;

            const x = body.ry[i] / this.units
            var y = 1 / this.units;
            var z = 1 / this.units;

            if (faceon) {
                y *= body.rx[i]
                z *= body.rz[i]
            } else {
                y *= body.rz[i]
                z *= -body.rx[i]
            }

            if (body instanceof Star) {
                var defs = this.svg.append("defs")
                defs.append("radialGradient")
                    .attr("id", "sun-glow-gradient")
                    .attr("cx", "50%")
                    .attr("cy", "50%")
                    .attr("r", "58%")
                    .selectAll("stop")
                    .data([
                        { offset: "0%", color: body.color },  // Center: original color
                        { offset: "100%", color: "black" }  // Edge: darker shadow
                    ])
                    .enter()
                    .append("stop")
                    .attr("offset", d => d.offset)
                    .attr("stop-color", d => d.color);

                color = "url(#sun-glow-gradient)"

                //Append the circular star
                this.svg.append("circle").attr("class", "circle")
                    .attr("cx", this.xScale(x))
                    .attr("cy", this.yScale(y))
                    .attr("r", radius)
                    .attr("pointer-events","none")
                    .style("fill", color)
            } else {
                const planetX = this.xScale(x)
                const planetY = this.yScale(y)

                const shadowArc = d3.arc()
                .innerRadius(0)
                .outerRadius(radius)
                .startAngle(0)
                .endAngle(2 * Math.PI);

                this.svg.append("path")
                    .attr("d", shadowArc())
                    .attr("transform", `translate(${planetX}, ${planetY})`)
                    .style("fill", body.color).attr("class", "arc");
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


        });
    }


}