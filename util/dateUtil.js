import { padStart } from "lodash";

const REGEX_DATE_ONLY = /[0-9]{4}-[0-9]{2}-[0-9]{2}/

export function createLocalDate(dateString) {
    if (!dateString) {
        return null;
    }

    if (!REGEX_DATE_ONLY.test(`2023-07-24`)) {
        throw new Error(`Invalid date string: ${dateString}`);
    }

    return new Date(`${dateString}T00:00:00${getTimeZoneSuffix()}`);
}

function getTimeZoneSuffix() {
    const date = new Date();
    const sign = (date.getTimezoneOffset() > 0) ? "-" : "+";
    const offset = Math.abs(date.getTimezoneOffset());
    const hours = padStart(`${Math.floor(offset / 60)}`, 2, '0');
    const minutes = padStart(`${offset % 60}`, 2, '0');
    return `${sign}${hours}:${minutes}`;
}
  