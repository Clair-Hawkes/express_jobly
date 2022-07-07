"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies(
          handle,
          name,
          description,
          num_employees,
          logo_url)
           VALUES
             ($1, $2, $3, $4, $5)
           RETURNING
                    handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"`,
      [
        handle,
        name,
        description,
        numEmployees,
        logoUrl,
      ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
      `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Takes in a query object and an array of company objects.
   *  query -> {nameLike:}
   *  Filters by nameLike, minEmployees, maxEmployees if applicable.
   *  Returns filtered companies array.
   */

  /**
   * $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ CHANGE LOG
   * 1. Removing companies paranmeter.
   * 2. Commented out company filtering if statements.
   * 3. Frankenstein's SQL Query:
   * 3a. SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           ORDER BY name

    3b. SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1
    3c. SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1
           ORDER BY name
    3d. Add in Generic 3 query filters
    3e. SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE
                name ILIKE TODO:,
                minEmployees <= num_employees,
                maxEmployees >= num_employees
           ORDER BY name
    3f. Add in the SQL Injection protection array.
    3g. SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE
                ${joined string of filters}
           ORDER BY name
   */

  static filterByCriteria(query) {
    const acceptedQueries = ["nameLike", "minEmployees", "maxEmployees"];
    const keysInQueryString = Object.keys(query);
    // Array [minEmployees,namelike]


    if (!keysInQueryString.every(key => acceptedQueries.includes(key))) {
      throw new BadRequestError(
        'Only nameLike, minEmployees, maxEmployees allowed.'
      );
    }

    const nameLike = query.nameLike;
    const minEmployees = query.minEmployees;
    const maxEmployees = query.maxEmployees;

    let sqlToFilter = [];
    let filterValues = [];

    if (parseInt(minEmployees) && parseInt(maxEmployees)) {
      if (minEmployees > maxEmployees) {
        throw new BadRequestError('minEmployees must be < maxEmployees');
      }
    }
    // TODO: Convert to SQL query of database

    if (nameLike){
      let nameFilter = `name ILIKE $${keysInQueryString.indexOf("nameLike")+1}`;
      sqlToFilter.push(nameFilter);

      filterValues.push(nameLike);

    }
    if (minEmployees){
      let minEmpFilter = `num_employees >= $${keysInQueryString.indexOf(minEmployees)+1}`;
      sqlToFilter.push(minEmpFilter);
    }
    if (maxEmployees){
      let maxEmpFilter = `num_employees <= $${keysInQueryString.indexOf(maxEmployees)+1}`;
      sqlToFilter.push(maxEmpFilter);
    }

    sqlToFilter = sqlToFilter.join(',');

    const sqlForFiltering = `
    SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE ${sqlToFilter}
           ORDER BY name
    `;

    // TODO: Need the [values] to inject into the SQL.

    //






    // if (nameLike) {
    //   companies = companies.filter(
    //     company => company.name.toLowerCase() === nameLike.toLowerCase());
    // }

    // if (minEmployees) {
    //   companies = companies.filter(
    //     company => company.numEmployees >= minEmployees);
    // }

    // if (maxEmployees) {
    //   companies = companies.filter(
    //     company => company.numEmployees <= maxEmployees);
    // }

    return companies;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE companies
      SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING
                handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
