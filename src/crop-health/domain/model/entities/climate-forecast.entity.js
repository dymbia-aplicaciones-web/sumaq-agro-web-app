import {requireDate, requireRange, requireText} from "../validation.js";

/**
 * Weather forecast predictions for an agricultural valley.
 *
 * @class ClimateForecast
 */
export class ClimateForecast {
    /**
     * @param {Object} props - Entity attributes.
     * @param {number} [props.id=0] - Forecast identifier.
     * @param {string} props.region - Valley or geographic region of the forecast.
     * @param {number} props.temperature - Expected temperature in degrees Celsius.
     * @param {number} props.rainChance - Estimated percentage probability of rain (0 to 100).
     * @param {string} props.forecastDate - Date for which the prediction applies.
     * @param {string} [props.source='AgroMonitoring'] - Weather provider source.
     */
    constructor({ id, region, temperature, rainChance, forecastDate, source }) {
        requireText(region);
        requireRange(temperature, -273.15);
        requireRange(rainChance, 0, 100);
        requireDate(forecastDate);
        this.id = id ?? 0;
        this.region = region;
        this.temperature = temperature;
        this.rainChance = rainChance;
        this.forecastDate = forecastDate;
        this.source = source ?? 'AgroMonitoring';
    }
}
