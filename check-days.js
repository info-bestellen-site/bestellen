const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const now = new Date();
console.log('Current Date:', now.toString());
console.log('Day Index (getDay()):', now.getDay());
console.log('Day Name:', days[now.getDay()]);

const target = new Date('2026-04-04'); // This is a Saturday
console.log('Date 2026-04-04 (Expected Saturday):', target.toString());
console.log('Day Index:', target.getDay());
