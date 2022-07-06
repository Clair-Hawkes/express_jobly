const { BadRequestError } = require("../expressError");

/**
 * Function sqlForPartialUpdate takes 2 parameters:
 * dataToUpdate: Object -> {firstName: 'Aliya', age: 32}
 *
 * jsToSql: Object -> {firstName: "first_name"}
 * The Keys = camelCase version of the Values = snake_case SQL column names
 *
 * jsToSql only requires values-
 * where js camelCase must be converted to SQL snake_case.
 *
 * Function works to protect against SQL injection by creating string SQL comds-
 * and an array of values to update.
 *
 * Returns : {
 *            setCols: `"first_name"=$1, "age"=$2`,
 *            values: ['Aliya', 32]
 *           }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {

  if(!(typeof dataToUpdate == "object") || (Array.isArray(dataToUpdate))){
    throw new BadRequestError();
  }

  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
