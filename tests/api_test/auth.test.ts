import supertest from "supertest";
import appExpress from "../../app.js";
import { describe, it, beforeAll, afterAll, expect } from "vitest";
import ApiController from "../../src/controllers/apiController.js";
import ApiDataLayer from "../../src/db/services/apiDataLayer.js";
import AuthDataLayer from "../../src/db/services/authDataLayer.js";
import AuthController from "../../src/controllers/authController.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const apiDAL = new ApiDataLayer();
const authDAL = new AuthDataLayer();
const apiController = new ApiController(apiDAL);
const authController = new AuthController(authDAL, apiDAL);

const request = supertest(appExpress(apiController, authController));
import { IUser } from "../../src/models/User.js";

let dbServer: MongoMemoryServer;

beforeAll(async () => {
  dbServer = await MongoMemoryServer.create();
  await mongoose.connect(dbServer.getUri());
});
afterAll(async () => {
  await dbServer.stop();
  console.log(dbServer.instanceInfo ? "DB still connected" : "DB stopped");
});

describe("auth routes", async () => {
  let user: IUser;
  let token: string;

  describe("test route", () => {
    it("initializing db", async () => {
      const data: IUser = {
        isAdmin: false,
        first_name: "test",
        last_name: "testlast",
        email: "testing@example.com",
        password: "mypassword",
        date_joined: new Date(),
      };
      const res = await request.post("/api/users").send(data);
      expect(res.status).toEqual(200);
      user = data;
    });
    it("returns 200 for getting test route", async () => {
      const res = await request.get("/auth/test");
      expect(res.status).toEqual(200);
    });
    it("returns 401 for non auth user accessing an auth route", async () => {
      const res = await request.get("/auth/test-auth");
      expect(res.status).toEqual(401);
    });

    it("returns 200 for auth user accessing an auth route", async () => {
      const res = await request.post("/auth/login").send({
        email: user.email,
        password: user.password,
      });
      expect(res.status).toEqual(200);
      token = res.headers["set-cookie"]![0].split(";")[0].split("=")[1];
      const res2 = await request
        .get("/auth/test-auth")
        .set("Cookie", `token=${token}`);
      expect(res2.status).toEqual(200);
    });
  });
  describe("testing login routes", () => {
    it("returns 400 if email or password is missing in login route", async () => {
      const res = await request.post("/auth/login").send({});
      expect(res.status).toEqual(400);
    });
    it("returns 400 if user does not exist", async () => {
      const res = await request.post("/auth/login").send({
        email: "nonexistent@example.com",
        password: "nonexistentpassword",
      });
      expect(res.status).toEqual(400);
    });
    it("returns 400 if password is incorrect", async () => {
      const res = await request.post("/auth/login").send({
        email: user.email,
        password: "nonexistentpassword",
      });
      expect(res.status).toEqual(400);
      expect(res.body.errors[0].message).toMatch(/password/i);
    });
    it("returns 400 if email is incorrect", async () => {
      const res = await request.post("/auth/login").send({
        email: "nonexistentemail@mail.com",
        password: user.password,
      });
      expect(res.status).toEqual(400);
      expect(res.body.errors[0].message).toMatch(/email/i);
    });
    it("returns 200 if login is successful", async () => {
      const res = await request.post("/auth/login").send({
        email: user.email,
        password: user.password,
      });
      expect(res.status).toEqual(200);
      token = res.headers["set-cookie"]![0].split(";")[0].split("=")[1];
      expect(token).toBeDefined();
    });
  });

  describe("testing logout routes", () => {
    it("returns 200 after signing out", async () => {
      const res = await request
        .post("/auth/logout")
        .set("Cookie", `token=${token}`);
      expect(res.status).toEqual(200);

      const res2 = await request.get("/auth/test-auth");
      expect(res2.status).toEqual(401);
    });
  });
});
