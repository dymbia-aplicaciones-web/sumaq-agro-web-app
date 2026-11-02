import logo from "../../../assets/logo-sumaqagro.png";

/**
 * Creates a branded PNG from the recorded observation, without changing its values
 * (Angular `presentation/utils/observation-image.ts`, same layout and colors).
 * @param {Object} plot - Field plot.
 * @param {Object} observation - Satellite observation.
 * @param {Object<string, string>} labels - Translated texts.
 * @param {string} locale - Intl locale.
 * @returns {Promise<Blob>} PNG image.
 */
export async function observationImage(plot, observation, labels, locale) {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    const wrap = (text, width) => {
        const lines = [];
        for (const paragraph of text.split(/\r?\n/)) {
            let line = '';
            for (const word of paragraph.split(/\s+/)) {
                if (context.measureText(`${line} ${word}`).width > width && line) { lines.push(line); line = ''; }
                line += (line ? ' ' : '') + word;
            }
            lines.push(line);
        }
        return lines;
    };
    context.font = '26px Arial';
    const nameLines = wrap(plot.name, 1020);
    const regionLines = wrap(plot.region, 1020);
    const recommendationLines = wrap(observation.recommendation || labels.noData, 1020);
    canvas.height = 1000 + (nameLines.length + regionLines.length) * 36 + recommendationLines.length * 36;
    context.fillStyle = '#f4f6ee'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff'; context.fillRect(40, 40, 1120, canvas.height - 80);
    context.fillStyle = '#005653'; context.fillRect(40, 40, 1120, 180);
    const image = await new Promise(resolve => {
        const img = new Image(); img.onload = () => resolve(img); img.onerror = () => resolve(null); img.src = logo;
    });
    if (image) {
        context.fillStyle = '#ffffff'; context.fillRect(75, 75, 110, 110);
        const ratio = Math.min(90 / image.naturalWidth, 90 / image.naturalHeight);
        const width = image.naturalWidth * ratio; const height = image.naturalHeight * ratio;
        context.drawImage(image, 130 - width / 2, 130 - height / 2, width, height);
    }
    context.fillStyle = '#ffffff'; context.font = 'bold 46px Arial'; context.fillText('SumaqAgro', 215, 115);
    context.font = '26px Arial'; context.fillText(labels.title, 215, 165);
    const text = (value, x, y, size = 26, bold = false, color = '#163b35') => {
        context.fillStyle = color; context.font = `${bold ? 'bold ' : ''}${size}px Arial`; context.fillText(value, x, y);
    };
    let y = 285;
    text(labels.plot, 90, y, 22, true, '#64756e'); y += 42;
    for (const line of nameLines) { text(line, 90, y, 30, true); y += 36; }
    for (const line of regionLines) { text(line, 90, y); y += 36; }
    y += 12;
    const captured = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' }).format(new Date(observation.date));
    text(`${labels.capture}: ${captured} (Lima)`, 90, y, 24);
    y += 55;
    const metric = (label, value, x, color) => {
        context.fillStyle = '#edf4ed'; context.fillRect(x, y, 490, 160);
        text(label, x + 26, y + 45, 26, true, color);
        text(value, x + 26, y + 120, 62, true, color);
    };
    metric('NDVI', observation.ndviMean.toFixed(2), 90, '#16803c');
    metric('NDWI', observation.ndwiMean.toFixed(2), 620, '#0369a1');
    y += 220;
    text(`${labels.area}: ${plot.areaHectares.toFixed(2)} ha`, 90, y);
    y += 45; text(`${labels.stress}: ${observation.stressAreaHectares.toFixed(2)} ha`, 90, y);
    y += 45; text(`${labels.clouds}: ${observation.cloudCoveragePercent.toFixed(1)}%`, 90, y);
    y += 45; text(`${labels.temperature}: ${(observation.surfaceTempKelvin - 273.15).toFixed(1)} °C`, 90, y);
    y += 70; text(labels.recommendation, 90, y, 28, true); y += 45;
    for (const line of recommendationLines) { text(line, 90, y); y += 36; }
    context.strokeStyle = '#d3dfd5'; context.beginPath(); context.moveTo(90, canvas.height - 160); context.lineTo(1110, canvas.height - 160); context.stroke();
    text(labels.footer, 90, canvas.height - 110, 20, false, '#64756e');
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png'));
}
