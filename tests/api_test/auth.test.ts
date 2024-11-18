import supertest from "supertest";
import appExpress from "../../app.js";
import { describe, it } from "vitest";
import ApiController from "../../src/controllers/apiController.js";
import ApiDataLayer from "../../src/db/services/apiDataLayer.js";

const apiDAL = new ApiDataLayer();
const apiController = new ApiController(apiDAL);
const request = supertest(appExpress(apiController));

describe("Auth apis", () => {
  it("should successfully signout", () => {
    request.post("/auth/signout").expect(200);
  });
});
