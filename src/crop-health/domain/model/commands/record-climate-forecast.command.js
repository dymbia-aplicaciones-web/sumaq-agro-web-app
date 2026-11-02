/**
 * Command to store climate predictions for an agricultural region.
 *
 * @class RecordClimateForecastCommand
 */
export class RecordClimateForecastCommand {
    /**
     * @param {Object} props - Command payload.
     * @param {string} props.region - Monitored region or valley.
     * @param {number} props.temperature - Temperature forecast in Celsius.
     * @param {number} props.rainChance - Probability of rain in percentage (0 to 100).
     * @param {string} props.forecastDate - Target date of forecast.
     * @param {string} [props.source='AgroMonitoring'] - Data provider source.
     */
    constructor({ region, temperature, rainChance, forecastDate, source }) {
        this.region = region;
        this.temperature = temperature;
        this.rainChance = rainChance;
        this.forecastDate = forecastDate;
        this.source = source ?? 'AgroMonitoring';
    }
}
