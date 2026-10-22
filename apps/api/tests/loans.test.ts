import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma";
import { app, auth, dateOnly, login, resetDb } from "./helpers";

let token: string;
beforeEach(async () => {
  await resetDb();
  ({ token } = await login());
});

const createLoan = (body: Record<string, unknown>, t = token) =>
  request(app).post("/api/loans").set(auth(t)).send(body);
const valid = { friendName: "Rohan", amount: 1000, dueDate: dateOnly(7) };

describe("creating loans", () => {
  it("creates a loan and stores money as integer paise", async () => {
    const res = await createLoan({ ...valid, amount: "1250.50", notes: " dinner " }).expect(201);
    expect(res.body.data).toMatchObject({
      friendName: "Rohan",
      amountPaise: 125050,
      status: "pending",
      notes: "dinner",
    });
  });

  it.each([
    [{ ...valid, amount: 0 }, "greater than 0"],
    [{ ...valid, amount: -5 }, "greater than 0"],
    [{ ...valid, amount: "12.345" }, "2 decimal"],
    [{ ...valid, amount: "abc" }, "greater than 0"],
    [{ ...valid, friendName: "   " }, "name is required"],
    [{ ...valid, dueDate: "not-a-date" }, "valid date"],
    [{ ...valid, dueDate: undefined }, "Due date is required"],
  ])("rejects invalid input %#", async (body, message) => {
    const res = await createLoan(body).expect(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(JSON.stringify(res.body.error.details)).toContain(message);
  });

  it("accepts a multipart receipt image and rejects non-images", async () => {
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64",
    );
    const res = await request(app)
      .post("/api/loans")
      .set(auth(token))
      .field("friendName", "Asha")
      .field("amount", "300")
      .field("dueDate", dateOnly(3))
      .attach("receipt", png, { filename: "r.png", contentType: "image/png" })
      .expect(201);
    expect(res.body.data.receiptUrl).toMatch(/^\/uploads\/.+\.png$/);
    await request(app).get(res.body.data.receiptUrl).expect(200);

    await request(app)
      .post("/api/loans")
      .set(auth(token))
      .field("friendName", "Asha")
      .field("amount", "300")
      .field("dueDate", dateOnly(3))
      .attach("receipt", Buffer.from("hello"), { filename: "r.txt", contentType: "text/plain" })
      .expect(400);
  });
});

describe("listing loans", () => {
  it("lists newest first and filters by status", async () => {
    const pending = (await createLoan({ ...valid, friendName: "Pending", dueDate: dateOnly(5) })).body.data;
    const overdue = (await createLoan({ ...valid, friendName: "Overdue", dueDate: dateOnly(-5) })).body.data;
    const repaid = (await createLoan({ ...valid, friendName: "Repaid", dueDate: dateOnly(-1) })).body.data;
    await request(app).patch(`/api/loans/${repaid.id}/repay`).set(auth(token)).expect(200);

    const names = async (status: string) =>
      (await request(app).get(`/api/loans?status=${status}`).set(auth(token)).expect(200)).body.data.loans.map(
        (l: { friendName: string }) => l.friendName,
      );
    expect(await names("all")).toEqual(["Repaid", "Overdue", "Pending"]);
    expect(await names("pending")).toEqual(["Pending"]);
    expect(await names("overdue")).toEqual(["Overdue"]);
    expect(await names("repaid")).toEqual(["Repaid"]);
    expect(pending.status).toBe("pending");
    expect(overdue.status).toBe("overdue");
    await request(app).get("/api/loans?status=bogus").set(auth(token)).expect(400);
  });
});

describe("cross-user isolation", () => {
  it("never lets another user read, repay, or delete a loan", async () => {
    const loan = (await createLoan(valid)).body.data;
    const other = (await login("9123456780")).token;

    await request(app).get(`/api/loans/${loan.id}`).set(auth(other)).expect(404);
    await request(app).patch(`/api/loans/${loan.id}/repay`).set(auth(other)).expect(404);
    await request(app).delete(`/api/loans/${loan.id}`).set(auth(other)).expect(404);
    expect((await request(app).get("/api/loans").set(auth(other))).body.data.loans).toHaveLength(0);
    expect((await request(app).get("/api/loans/summary").set(auth(other))).body.data.totalLentPaise).toBe(0);

    const still = await prisma.loan.findUniqueOrThrow({ where: { id: loan.id } });
    expect(still.isRepaid).toBe(false);
    await request(app).get("/api/loans/not-a-uuid").set(auth(token)).expect(404);
  });
});

describe("repaying loans", () => {
  it("marks repaid with a timestamp and blocks duplicate repayment", async () => {
    const loan = (await createLoan(valid)).body.data;
    const res = await request(app).patch(`/api/loans/${loan.id}/repay`).set(auth(token)).expect(200);
    expect(res.body.data).toMatchObject({ isRepaid: true, status: "repaid" });
    expect(res.body.data.repaidAt).toBeTruthy();
    const dup = await request(app).patch(`/api/loans/${loan.id}/repay`).set(auth(token)).expect(409);
    expect(dup.body.error.code).toBe("ALREADY_REPAID");
  });

  it("records only one repayment when requests race", async () => {
    const loan = (await createLoan(valid)).body.data;
    const results = await Promise.all(
      [1, 2, 3, 4].map(() => request(app).patch(`/api/loans/${loan.id}/repay`).set(auth(token))),
    );
    expect(results.filter((r) => r.status === 200)).toHaveLength(1);
    expect(results.filter((r) => r.status === 409)).toHaveLength(3);
  });
});

describe("deleting loans", () => {
  it("deletes unpaid loans but not repaid ones", async () => {
    const a = (await createLoan(valid)).body.data;
    const b = (await createLoan(valid)).body.data;
    await request(app).patch(`/api/loans/${b.id}/repay`).set(auth(token));
    await request(app).delete(`/api/loans/${a.id}`).set(auth(token)).expect(200);
    await request(app).get(`/api/loans/${a.id}`).set(auth(token)).expect(404);
    await request(app).delete(`/api/loans/${b.id}`).set(auth(token)).expect(409);
  });
});

describe("GET /api/loans/summary", () => {
  const summary = async () => (await request(app).get("/api/loans/summary").set(auth(token)).expect(200)).body.data;

  it("returns zeros for a new user", async () => {
    expect(await summary()).toMatchObject({ totalLentPaise: 0, totalRepaidPaise: 0, overdueAmountPaise: 0 });
  });

  it("applies the business rules, including due-today and future edge cases", async () => {
    await createLoan({ ...valid, amount: 1000, dueDate: dateOnly(-3) }); // overdue
    await createLoan({ ...valid, amount: "250.75", dueDate: dateOnly(0) }); // due today -> NOT overdue yet
    await createLoan({ ...valid, amount: 500, dueDate: dateOnly(10) }); // future
    const repaidOverdue = (await createLoan({ ...valid, amount: 2000, dueDate: dateOnly(-8) })).body.data;

    let s = await summary();
    expect(s.totalLentPaise).toBe(100000 + 25075 + 50000 + 200000);
    expect(s.totalRepaidPaise).toBe(0);
    expect(s.overdueAmountPaise).toBe(100000 + 200000);

    await request(app).patch(`/api/loans/${repaidOverdue.id}/repay`).set(auth(token)).expect(200);
    s = await summary();
    expect(s.totalLentPaise).toBe(375075); // repaid loans still count as lent
    expect(s.totalRepaidPaise).toBe(200000);
    expect(s.overdueAmountPaise).toBe(100000); // repaid loan excluded from overdue
  });

  it("treats a timestamp due date that has just passed as overdue", async () => {
    await createLoan({ ...valid, amount: 100, dueDate: new Date(Date.now() - 1000).toISOString() });
    expect((await summary()).overdueAmountPaise).toBe(10000);
  });
});
