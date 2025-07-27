import { DateTime } from 'luxon';

const unixSeconds = 1753638334; // example timestamp in seconds

const dt = DateTime.fromSeconds(unixSeconds, { zone: 'utc' });
const ist = dt.setZone('Asia/Kolkata');

// Show IST with offset and zone name
console.log(ist.toFormat("yyyy-MM-dd HH:mm:ss ZZZZ '('ZZ')'"));
