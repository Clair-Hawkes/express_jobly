const jwt = require("jsonwebtoken");
// const { createToken } = require("./tokens");
const { sqlForPartialUpdate } = require("./sql");


const { SECRET_KEY } = require("../config");
const { BadRequestError } = require("../expressError");

// TODO: Write Unit tests Not integration tests.

describe("sqlPartialUpdate", function () {
  test("works", function () {
    const result = sqlForPartialUpdate({firstName: 'Aliya', age: 32},
    {firstName: "first_name"});
    expect(result).toEqual({
      setCols: `"first_name"=$1, "age"=$2`,values: ['Aliya', 32]});
  });


  test("Doesn't work: Empty dataToInput {}", function () {
    expect(() => {
      sqlForPartialUpdate({},{firstName: "first_name"});
      }).toThrow(BadRequestError);
  });

  // test("Doesn't works: dataToInput not an Obj", function () {
  //   // given the security risk if this didn't work, checking this specifically
  //   const token = createToken({ username: "test" });
  //   const payload = jwt.verify(token, SECRET_KEY);
  //   expect(payload).toEqual({
  //     iat: expect.any(Number),
  //     username: "test",
  //     isAdmin: false,
  //   });
  // });
});