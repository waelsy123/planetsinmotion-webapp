
export const linspace = (start, stop, num) => {
    const step = (stop - start) / (num - 1);
    return Array.from({ length: num }, (_, i) => start + i * step);
};



export function drawBody(context, canvas, x, y, body, ratio) {
    // Draw star face on
    context.save()
    context.beginPath();
    context.arc(canvas.width / 2 + x * ratio, 
        canvas.height / 2  + y * ratio, body._R * ratio, 0, 2 * Math.PI);
    context.fillStyle = body.color
    context.fill();
    context.restore()
}