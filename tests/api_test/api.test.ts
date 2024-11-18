import supertest from "supertest";
import appExpress from "../../app.js";
import { it, describe, beforeAll, afterAll, expect } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import ApiController from "../../src/controllers/apiController.js";
import ApiDataLayer from "../../src/db/services/apiDataLayer.js";

const apiDAL = new ApiDataLayer();
const apiController = new ApiController(apiDAL);

const request = supertest(appExpress(apiController));

let dbServer: MongoMemoryServer;

beforeAll(async () => {
  dbServer = await MongoMemoryServer.create();
  await mongoose.connect(dbServer.getUri());
});
afterAll(async () => {
  await dbServer.stop();
  console.log(dbServer.instanceInfo ? "DB still connected" : "DB stopped");
});

describe("Ping test route endpoint", () => {
  it("should return test api", async () => {
    // request.get("/api/test").expect(200).expect("Content-Type", /json/i);
    const res = await request.get("/api/test");
    expect(res.status).toEqual(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).not.toHaveProperty("message");
  });
  it("should return 404 for invalid url", async () => {
    request.get("/api/test/idk").expect(404);
  });
});
describe("Api home end point", () => {
  it("should return home json data for authed users", async () => {
    // request.get("/api/home").expect(200).expect("Content-Type", /json/i);
    const res = await request.get("/api/home").withCredentials(true);
    expect(res.status).toEqual(200);
    expect(res.headers["content-type"]).toMatch(/json/i);
    expect(res.body).toHaveProperty("data");
  });
});
describe("Api categories end point", () => {
  let categoryId: string;

  it("returns an array of categories", async () => {
    const res = await request.get("/api/categories");
    expect(res.status).toEqual(200);
    expect(res.headers["content-type"]).toMatch(/json/i);
    expect(res.body).toHaveProperty("categories");
    expect(Array.isArray(res.body.categories)).toBe(true);
  });
  it("returns 200 for created category", async () => {
    const payload = { name: "myTest" };
    const res = await request.post("/api/categories").send(payload);
    expect(res.status).toEqual(200);
    const res2 = await request.get("/api/categories");
    expect(Array.isArray(res2.body.categories)).toBe(true);
    expect(res2.body.categories.length).toBeGreaterThan(0);
  });
  it("returns 200 after editing category name", async () => {
    const payload = { name: "myTest" };
    const res = await request.post("/api/categories").send(payload);
    expect(res.status).toEqual(200);
    const createdId = res.body.id;
    categoryId = createdId;

    const resPut = await request
      .put(`/api/category/${createdId}`)
      .send({ name: "testing123" });
    expect(resPut.status).toEqual(200);
    expect(resPut.body.id).toMatch(createdId);
  });
  it("returns 200 when deleting a category", async () => {
    const res = await request.delete(`/api/category/${categoryId}`);
    expect(res.status).toEqual(200);
    const resGet = await request.get(`/api/category/${categoryId}`);
    expect(resGet.status).toEqual(404);
  });
});

//describe("Api global feeds end point", () => {});
//describe("Api users end point", () => {});
//describe("Api user\'s feeds end point", () => {});
