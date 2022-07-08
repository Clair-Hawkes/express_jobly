"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");

// $$$$$$$$$$$ Will we need the company methods?
const Company = require("./company.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

// $$$$$$$$$$$$$$$

const Job = require("./jobs");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

const { fail } = require("../helpers/fail");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 1000,
    equity: .01,
    company_handle: "c1",
  };
  const jobNegetiveSalary = {
    title: "new",
    salary: -1000,
    equity: .01,
    company_handle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(newJob);

    const result = await db.query(
      `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'new'`);
    expect(result.rows).toEqual([
      {
        title: "new",
        salary: 1000,
        equity: .01,
        company_handle: "c1",
      }
    ]);
  });

  test("bad request with negetive salary", async function () {
    try {
      await Job.create(jobNegetiveSalary);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll jobs", function () {
  test("works: no filter", async function () {
    let jobs = await Jobs.findAll();
    expect(jobs).toEqual([
      {
        title: "new",
        salary: 1000,
        equity: .01,
        company_handle: "c1",
      },
      {
        title: "new2",
        salary: 2000,
        equity: .02,
        company_handle: "c2",
      },
      {
        title: "new3",
        salary: 3000,
        equity: .03,
        company_handle: "c3",
      }
    ]);
  });
});

/************************************** filterByCriteria */

describe("filterByCriteria", function () {
  test("works:", async function () {
    const query = { nameLike: 'c1', minEmployees: 0, maxEmployees: 2 };
    const filtered = await Company.filterByCriteria(query);
    expect(filtered).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    ]);
  });

  test("works with partial name:", async function () {
    const query = { nameLike: 'c', minEmployees: 0, maxEmployees: 2 };
    const filtered = await Company.filterByCriteria(query);
    expect(filtered).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
    ]);
  });


  test("works without nameLike:", async function () {
    const query = { minEmployees: 1, maxEmployees: 2 };
    const filtered = await Company.filterByCriteria(query);
    expect(filtered).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      }
    ]);
  });

  test("doesn't work if minEmployees > maxEmployees:", async function () {
    try {
      const query = { nameLike: 'c1', minEmployees: 3, maxEmployees: 2 };
      await Company.filterByCriteria(query);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("doesn't work: other invalid query param provided", async function () {
    try {
      const query = { description: 'badparam' };
      await Company.filterByCriteria(query);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let company = await Company.get("c1");
    expect(company).toEqual({
      handle: "c1",
      name: "C1",
      description: "Desc1",
      numEmployees: 1,
      logoUrl: "http://c1.img",
    });
  });

  test("not found if no such company", async function () {
    try {
      await Company.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    name: "New",
    description: "New Description",
    numEmployees: 10,
    logoUrl: "http://new.img",
  };

  test("works", async function () {
    let company = await Company.update("c1", updateData);
    expect(company).toEqual({
      handle: "c1",
      ...updateData,
    });

    const result = await db.query(
      `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: 10,
      logo_url: "http://new.img",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      name: "New",
      description: "New Description",
      numEmployees: null,
      logoUrl: null,
    };

    let company = await Company.update("c1", updateDataSetNulls);
    expect(company).toEqual({
      handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
      `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: null,
      logo_url: null,
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Company.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Company.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Company.remove("c1");
    const res = await db.query(
      "SELECT handle FROM companies WHERE handle='c1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Company.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
