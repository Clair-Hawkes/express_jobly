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
  testJobId
} = require("./_testCommon");

// $$$$$$$$$$$$$$$

const Job = require("./jobs");

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
    equity: '0.01',
    company_handle: "c1",
  };
  const jobNegetiveSalary = {
    title: "new",
    salary: -1000,
    equity: '0.01',
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
        equity: '0.01',
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
        equity: '0.01',
        company_handle: "c1",
      },
      {
        title: "new2",
        salary: 2000,
        equity: '0.02',
        company_handle: "c2",
      },
      {
        title: "new3",
        salary: 3000,
        equity: '0.03',
        company_handle: "c3",
      }
    ]);
  });
});

/************************************** filterByCriteria */

describe("filterByCriteria", function () {
  test("works:", async function () {
    const query = { title: 'new2', minSalary: 0, hasEquity: true };
    const filtered = await Job.filterByCriteria(query);
    expect(filtered).toEqual([
      {
        title: "new2",
        salary: 2000,
        equity: '0.02',
        company_handle: "c2",
      }
    ]);
  });

  test("works with partial name:", async function () {
    const query = { title: 'n', minSalary: 0, hasEquity: true };
    const filtered = await Job.filterByCriteria(query);
    expect(filtered).toEqual([
      {
        title: "new",
        salary: 1000,
        equity: '0.01',
        company_handle: "c1",
      },
      {
        title: "new2",
        salary: 2000,
        equity: '0.02',
        company_handle: "c2",
      },
      {
        title: "new3",
        salary: 3000,
        equity: '0.03',
        company_handle: "c3",
      }
    ]);
  });


  test("works without title:", async function () {
    const query = { minSalary: 1500, hasEquity: true };
    const filtered = await Job.filterByCriteria(query);
    expect(filtered).toEqual([
      {
        title: "new2",
        salary: 2000,
        equity: '0.02',
        company_handle: "c2",
      },
      {
        title: "new3",
        salary: 3000,
        equity: '0.03',
        company_handle: "c3",
      }
    ]);
  });

  test("doesn't work: other invalid query param provided", async function () {
    try {
      const query = { description: 'badparam' };
      await Job.filterByCriteria(query);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(testJobId);
    expect(job).toEqual({
      title: "new",
      salary: 1000,
      equity: '0.01',
      company_handle: "c1",
    });
  });

  test("not found if no such company", async function () {
    try {
      await Job.get(100000000);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "NewTitle",
    salary: 9999,
    equity: '0.99'
  };

  test("works", async function () {
    let job = await Job.update(testJobId, updateData);
    expect(job).toEqual({
      id: testJobId,
      companyHandle: 'c1',
      ...updateData,
    });

    const result = await db.query(
      `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${testJobId}`);
    expect(result.rows).toEqual([{
      id:testJobId,
      title: "NewTitle",
      salary: 9999,
      equity: '0.99',
      company_handle: 'c1'
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "NewTitle",
      salary: null,
      equity: null,
    };

    let job = await Job.update(testJobId, updateDataSetNulls);
    expect(company).toEqual({updateDataSetNulls});

    const result = await db.query(
      `SELECT title, salary, equity, company_handle,
           FROM jobs
           WHERE id = ${testJobId}`);
    expect(result.rows).toEqual([{
      title: "NewTitle",
      salary: null,
      equity: null,
      company_handle: 'c1',
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Job.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(testJobId, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(testJobId);
    const res = await db.query(
      `SELECT id FROM jobs WHERE id=${testJobId}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
