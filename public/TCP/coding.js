//Functions for encoding and decoding TCP

// Function for formatting data in a way the simulator understands
function encodeData(data) {
  return data;
}

// Function for decoding data from bytearray to doubles
function decodeData(buf) {
  // buf should be a 48-bit Buffer containing 6 doubles (2 bytes)
  
  // Values is in this order
  const values = ["north", "east", "down", "roll", "pitch", "yaw"];
  const result = {};
  values.map((value, i) => {
    result[value] = buf.readDoubleLE(8*i);
  });
  return result;
}

module.exports = { encodeData, decodeData };
