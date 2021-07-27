const crypto = require("crypto");

function getHashName() {
  return (
    "_" +
    crypto
      .createHash("sha256")
      .update(Math.random().toString(), "utf-8")
      .digest("hex")
  );
}

module.exports = {
  getHashName
};
