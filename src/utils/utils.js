// Takes in a value and makes sure it is in the interval [min, max]
function normalize(value, min, max) {
  value = Math.min(value, max);
  value = Math.max(value, min);
  return value;
}

// Convert from degrees to radians
const degreesToRadians = degrees => {
  const maxRads = 2 * Math.PI;
  let radians = (Number(degrees) * (Math.PI / 180)) % maxRads;
  while (radians < 0) {
    radians += maxRads;
  }
  return radians;
};

const radiansToDegrees = radians => {
  let degrees = (Number(radians) * (180 / Math.PI)) % 360;
  while (degrees < 0) {
    degrees += 360;
  }
  return degrees;
};

module.exports = { normalize, degreesToRadians, radiansToDegrees };