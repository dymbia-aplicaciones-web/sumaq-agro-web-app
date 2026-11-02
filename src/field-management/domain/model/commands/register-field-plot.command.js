/**
 * Registers a new plot for the producer.
 *
 * @class RegisterFieldPlotCommand
 */
export class RegisterFieldPlotCommand {
    /**
     * @param {Object} props - Command data.
     * @param {number} props.ownerUserId - Producer who owns the plot.
     * @param {string} props.name - Name of the plot.
     * @param {string} props.region - Region or valley of the plot.
     * @param {number} [props.declaredAreaHectares=0] - Area the producer declares, in hectares,
     * until the GPS polygon is marked.
     */
    constructor({ ownerUserId, name, region, declaredAreaHectares }) {
        this.ownerUserId = ownerUserId;
        this.name = name;
        this.region = region;
        this.declaredAreaHectares = declaredAreaHectares ?? 0;
    }
}
