const uuid = require("uuid");

// Random Number Generator
const RandomNumber = () => Math.floor(Math.random() * 1000) + 1;
// Basically This is Return RandomNumber(1-1000)+CurrentTimeInMilliSecond+RandomNumber(1-1000)
const UniqueNumber = () => `${RandomNumber()}${Date.now()}${RandomNumber()}`;
// Basically This is Return RandomNumber(1-1000)+"-"+CurrentTimeInMilliSecond +"-"+RandomNumber(1-1000)
const UniqueNumberId = () => `${RandomNumber()}-${Date.now()}-${RandomNumber()}`;
// Generate Number OTP
const UniqueOTP = (length = 6) => Math.floor(Math.random() * (Math.pow(10, length) - 1 - Math.pow(10, length - 1) + 1)) + Math.pow(10, length - 1);
// Generate Character OTP
const UniqueCharOTP = (length = 6) => {
  let otp = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * characters.length);
    otp += characters[index];
  }
  return otp;
};
// Generate Color HEX Code
const HEXColor = (isWithoutSymbole = false) => {
  return isWithoutSymbole ? Math.floor(Math.random() * 16777215).toString(16) : "#" + Math.floor(Math.random() * 16777215).toString(16);
};

const RandomString = (length = 6) => {
  let otp = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * characters.length);
    otp += characters[index];
  }
  return otp;
};

// convert semua huruf ke kecil semua
const strtolower = (text) => {
  if (text == null || text == "") return null;
  return text.toLowerCase();
};
// convert semua huruf ke capital semua
const strtoupper = (text) => {
  if (text == null || text == "") return null;
  return text.toUpperCase();
};

const ucword = (text) => {
  if (text == null || text == "") return null;
  return text.toLowerCase().replace(/\b[a-z]/g, function (letter) {
    return letter.toUpperCase();
  });
};

module.exports = { strtolower, strtoupper, ucword, RandomString, UniqueNumber, UniqueNumberId, UniqueOTP, UniqueCharOTP, HEXColor, uuid };
