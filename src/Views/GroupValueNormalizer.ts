import Services from 'Base/Services';
import { PropertyNativeType } from 'Data/PropertyManager';

/**
 * Normalizes grouped values before writing frontmatter for tag properties.
 * Only tag properties are transformed; all other property types are returned unchanged.
 * @param propertyKey Frontmatter property key.
 * @param value Grouped raw value from board interactions.
 * @returns Normalized value suitable for frontmatter updates.
 */
export function normalizeValueForPropertyType(propertyKey: string, value: unknown): unknown {
    const propertyType = Services.propertyManager.getPropertyType(propertyKey);
    if (propertyType !== PropertyNativeType.TAGS || value == null) {
        return value;
    }

    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed ? [trimmed] : [];
    }

    console.warn(`[BoardView] Unsupported tag group value type for '${propertyKey}'`, value);
    return [];
}
