import supertest from "supertest";
import app from "../../app.js";
import { describe, it } from "vitest";

const request = supertest(app);

describe("Auth apis", () => {
  it("should successfully signout", () => {
    request.post("/auth/signout").expect(200);
  });
});
