import crypto from "crypto"

/**
 * Hash
 * @param value
 * @returns {*}
 */
export function hash(value) {

    return crypto.createHash('sha256').update(String(value)).digest('hex');
}