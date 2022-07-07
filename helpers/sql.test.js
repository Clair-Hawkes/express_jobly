'use strict';

const jwt = require("jsonwebtoken");
// const { createToken } = require("./tokens");
const { sqlForPartialUpdate } = require("./sql");


const { SECRET_KEY } = require("../config");
const { BadRequestError } = require("../expressError");


describe("sqlPartialUpdate", function () {
  test("works", function () {
    const result = sqlForPartialUpdate({ firstName: 'Aliya', age: 32 },
      { firstName: "first_name" });
    expect(result).toEqual({
      setCols: `"first_name"=$1, "age"=$2`, values: ['Aliya', 32]
    });
  });


  test("Doesn't work: Empty dataToInput {}", function () {
    expect(() => {
      sqlForPartialUpdate({}, { firstName: "first_name" });
    }).toThrow(BadRequestError);
  });

  test("Doesn't work: dataToInput not an Obj", function () {
    expect(() => {
      sqlForPartialUpdate('Aliya', { firstName: "first_name" });
    }).toThrow(BadRequestError);
  });
});