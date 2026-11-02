/**
 * Saves the GPS polygon of a plot.
 *
 * @class DelineatePlotBoundaryCommand
 */
export class DelineatePlotBoundaryCommand {
    /**
     * @param {Object} props - Command data.
     * @param {number} props.plotId - Plot to delineate.
     * @param {import('../entities/field-plot.entity.js').GeoCoordinate[]} props.coordinates - Vertices of the polygon; at least three.
     * @param {number} props.areaHectares - Area of the polygon, in hectares, calculated on the map.
     */
    constructor({ plotId, coordinates, areaHectares }) {
        this.plotId = plotId;
        this.coordinates = coordinates;
        this.areaHectares = areaHectares;
    }
}
