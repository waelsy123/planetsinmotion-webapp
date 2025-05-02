
export const linspace = (start, stop, num) => {
    const step = (stop - start) / (num - 1);
    return Array.from({ length: num }, (_, i) => start + i * step);
};

export function darkenColor(hex, percent) {
    // Remove the '#' if it exists
    hex = hex.replace(/^#/, '');

    // Parse the hex color into RGB components
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Darken each component by the given percentage
    r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent / 100))));
    g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent / 100))));
    b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent / 100))));

    // Convert the RGB components back to a hex string
    const darkenedHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

    return darkenedHex;
}


export function downloadBlob(blob, name, format) {

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = name + "." + format;
    a.click();
    setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }, 100); // 100ms buffer
}