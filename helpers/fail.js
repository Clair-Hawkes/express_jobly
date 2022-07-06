const { BadRequestError } = require("../expressError");

function fail(){
  throw new Error('Test failed, should not have reached this code.');
}

module.exports = { fail };
