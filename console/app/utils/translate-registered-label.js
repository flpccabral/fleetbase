/**
 * Resolve a label registered by an extension, which may be a translation key.
 *
 * Extensions register admin menu items and panels once, when the console boots
 * and before the user's locale is applied, so they pass translation keys
 * (e.g. `fleet-ops.extension.admin.routing`) instead of text. Values that are
 * not a known key, such as plain English titles, are returned unchanged.
 *
 * @param {Service} intl - The ember-intl service.
 * @param {*} value - A translation key or plain text.
 * @return {*}
 */
export default function translateRegisteredLabel(intl, value) {
    if (!intl || typeof value !== 'string' || value === '') {
        return value;
    }

    return intl.exists(value) ? intl.t(value) : value;
}
