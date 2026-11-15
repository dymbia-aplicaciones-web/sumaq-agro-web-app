import {HarvestCropType, QualityCategory, SPECIALTY_COFFEE_SCORE} from "./harvest-certification.enums.js";

/**
 * Rules of the intake and grading sheet (Angular `HarvestCertificatesView.preview`).
 * An evaluation has: cropType, grossKg, tareKg, sampleKg, firstPercentage,
 * secondPercentage, thirdPercentage, weevilDamagePercentage and scaScore.
 */

/**
 * @param {{grossKg: number, tareKg: number}} evaluation - Weights.
 * @returns {number} Net weight (gross − tare, never negative).
 */
export function netWeightKg(evaluation) {
    return Math.max(0, evaluation.grossKg - evaluation.tareKg);
}

/**
 * Validates an evaluation.
 * @param {Object} evaluation - Evaluation data.
 * @returns {{key: string, params?: Object}|null} The first error (i18n key and parameters), or `null` when valid.
 */
export function validateEvaluation(evaluation) {
    const net = netWeightKg(evaluation);
    if (!Number.isFinite(evaluation.grossKg) || !Number.isFinite(evaluation.tareKg) ||
        evaluation.grossKg <= 0 || evaluation.tareKg < 0 || net <= 0) {
        return { key: 'harvest-certification.errors.gross-weight', params: { gross: evaluation.grossKg, tare: evaluation.tareKg } };
    }
    if (!Number.isFinite(evaluation.sampleKg) || evaluation.sampleKg <= 0 || evaluation.sampleKg > net) {
        return { key: 'harvest-certification.errors.sample-weight', params: { net } };
    }
    if (evaluation.cropType === HarvestCropType.ANDEAN_POTATO) {
        const total = evaluation.firstPercentage + evaluation.secondPercentage + evaluation.thirdPercentage;
        const percentages = [evaluation.firstPercentage, evaluation.secondPercentage,
            evaluation.thirdPercentage, evaluation.weevilDamagePercentage];
        if (percentages.some(value => !Number.isFinite(value) || value < 0 || value > 100) ||
            Math.abs(total - 100) > 0.01) {
            return { key: 'harvest-certification.errors.potato-grading' };
        }
    } else if (!Number.isFinite(evaluation.scaScore) || evaluation.scaScore < 0 || evaluation.scaScore > 100) {
        return { key: 'harvest-certification.errors.sca-score' };
    }
    return null;
}

/**
 * Quality category of a valid evaluation:
 * - Coffee: specialty from 80 SCA points, otherwise commercial.
 * - Potato: Gold with ≥ 65 % first caliber and ≤ 15 % weevil damage; standard
 *   with ≥ 45 % first caliber; otherwise grade B (requires sorting).
 * @param {Object} evaluation - Evaluation data.
 * @returns {string} Quality category.
 */
export function classifyQuality(evaluation) {
    if (evaluation.cropType === HarvestCropType.SPECIALTY_COFFEE) {
        return evaluation.scaScore >= SPECIALTY_COFFEE_SCORE ? QualityCategory.SPECIALTY_COFFEE : QualityCategory.COMMERCIAL_COFFEE;
    }
    if (evaluation.firstPercentage >= 65 && evaluation.weevilDamagePercentage <= 15) return QualityCategory.PREMIUM_GOLD;
    return evaluation.firstPercentage >= 45 ? QualityCategory.STANDARD : QualityCategory.B_GRADE_REQUIRES_SORTING;
}
