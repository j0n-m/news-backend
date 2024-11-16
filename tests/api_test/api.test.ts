import supertest from "supertest";
import app from "../../app.js";
import { it, describe } from "vitest";

const request = supertest(app);

describe("Ping test route endpoint", () => {
  it("should return test api", () => {
    request.get("/api/test").expect(200).expect("Content-Type", /json/i);
  });
  it("should return 404 for invalid url", async () => {
    request.get("/api/test/idk").expect(404);
  });
});
describe("Api home end point", () => {
  it("should return home data for authed users", () => {
    request.get("/api/home").expect(200).expect("Content-Type", /json/i);
  });
});

//describe("Api feed categories end point", () => {});
//describe("Api global feeds end point", () => {});
//describe("Api users end point", () => {});
//describe("Api user\'s feeds end point", () => {});
