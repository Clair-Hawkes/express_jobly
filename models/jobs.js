"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForFilteringCompanies } = require("../helpers/sql");
// TODO: Rmv unused/ create sqlFIlteringForJobsFunc

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   * Where company_handle is a foriegn key to companies table.
   *
   * Returns { title, salary, equity, companyHandle }
   *
   * Duplicate jobs will have different serialized id's in database.
  */

  static async create({ title, salary, equity, company_handle }) {
    // const duplicateCheck = await db.query(
    //   `SELECT handle
    //        FROM companies
    //        WHERE handle = $1`,
    //   [handle]);

    // if (duplicateCheck.rows[0])
    //   throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO jobs(
          title,
          salary,
          equity,
          company_handle)
        VALUES
          ($1,$2,$3,$4)
        RETURNING
          title,
          salary,
          equity,
          company_handle AS "companyHandle"`,
      [
        title,
        salary,
        equity,
        company_handle,
      ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ title, salary, equity, companyHandle }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
      `SELECT
            title,
            salary,
            equity,
            company_handle AS "companyHandle"
           FROM jobs
           ORDER BY title`);
    return jobsRes.rows;
  }

  /** Given a jobs id, return data about the job.
   *
   * Returns { title, salary, equity, companyHandle, companyInfo }
   *  TODO: Add in table join for providing comnpany info
   *   where companyInfo is [{ description, logoUrl }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT title,
                salary,
                equity,
                company_handle AS "companyHandle",
           FROM jobs
           WHERE id = $1`,
      [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job by that id: ${id}`);

    return job;
  }

  // TODO:
  /** Takes in a query object and an array of company objects.
   *  query -> {nameLike:}
   *  Filters by nameLike, minEmployees, maxEmployees if applicable.
   *  Returns filtered companies array.
   */
  static async filterByCriteria(query) {
    const acceptedQueries = ["nameLike", "minEmployees", "maxEmployees"];
    const keysInQueryString = Object.keys(query);

    if (!keysInQueryString.every(key => acceptedQueries.includes(key))) {
      throw new BadRequestError(
        'Only nameLike, minEmployees, maxEmployees allowed.'
      );
    }

    const { minEmployees, maxEmployees } = query;

    const { setCols, values } = sqlForFilteringCompanies(query);

    if (minEmployees !== undefined && maxEmployees !== undefined) {
      if (minEmployees > maxEmployees) {
        throw new BadRequestError('minEmployees must be < maxEmployees');
      }
    }

    const sqlForFiltering = `
  SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
         FROM companies
         WHERE ${setCols}
         ORDER BY name;
  `;

    const result = await db.query(sqlForFiltering, values);
    const companies = result.rows;

    return companies;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        companyHandle: "companyHandle",
      });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE jobs
      SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING
                id,
                title,
                company_handle AS "companyHandle",
                salary,
                equity`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;
