import supertest from "supertest";
import appExpress from "../../app.js";
import { it, describe, beforeAll, afterAll, expect } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import ApiController from "../../src/controllers/apiController.js";
import ApiDataLayer from "../../src/db/services/apiDataLayer.js";
import AuthDataLayer from "../../src/db/services/authDataLayer.js";
import AuthController from "../../src/controllers/authController.js";
import { IUser } from "../../src/models/User.js";
import bcrypt from "bcrypt";

const apiDAL = new ApiDataLayer();
const authDAL = new AuthDataLayer();
const apiController = new ApiController(apiDAL);
const authController = new AuthController(authDAL, apiDAL);

const request = supertest(appExpress(apiController, authController));

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
// describe("Api home end point", () => {
//   it("should return home json data for authed users", async () => {
//     // request.get("/api/home").expect(200).expect("Content-Type", /json/i);
//     const res = await request.get("/api/home").withCredentials(true);
//     expect(res.status).toEqual(200);
//     expect(res.headers["content-type"]).toMatch(/json/i);
//     expect(res.body).toHaveProperty("data");
//   });
// });
describe("Using endpoints as admin user", () => {
  let adminUser: IUser;
  let cookie: string;

  it("initializing db", async () => {
    const hashedPassword = await bcrypt.hash("mypassword", 10);
    const res = await apiDAL.createUser({
      data: {
        isAdmin: true,
        first_name: "test",
        last_name: "testlast",
        email: "testing@example.com",
        password: hashedPassword,
        date_joined: new Date(),
      },
    });
    expect(res?.id).toBeDefined();

    adminUser = res.toJSON();
  });
  it("successfully logins as admin user", async () => {
    const res = await request
      .post("/auth/login")
      .send({
        email: "testing@example.com",
        password: "mypassword",
      })
      .withCredentials(true);
    expect(res.status).toEqual(200);
    cookie = res.headers["set-cookie"]![0]!.split(";")[0];
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
      const res = await request
        .post("/api/categories")
        .send(payload)
        .set("Cookie", cookie);
      expect(res.status).toEqual(200);
      const res2 = await request.get("/api/categories");
      expect(Array.isArray(res2.body.categories)).toBe(true);
      expect(res2.body.categories.length).toBeGreaterThan(0);
    });
    it("returns 200 after editing category name", async () => {
      const payload = { name: "myTest" };
      const res = await request
        .post("/api/categories")
        .send(payload)
        .set("Cookie", cookie)
        .withCredentials(true);
      expect(res.status).toEqual(200);
      const createdId = res.body.id;
      categoryId = createdId;

      const resPut = await request
        .put(`/api/category/${createdId}`)
        .send({ name: "testing123" })
        .set("Cookie", cookie);
      expect(resPut.status).toEqual(200);
      expect(resPut.body.id).toMatch(createdId);
    });
    it("returns 200 when deleting a category", async () => {
      const res = await request
        .delete(`/api/category/${categoryId}`)
        .set("Cookie", cookie);
      expect(res.status).toEqual(200);
      const resGet = await request.get(`/api/category/${categoryId}`);
      expect(resGet.status).toEqual(404);
    });
  });

  describe("Api feeds end point", () => {
    let feedId: string;

    it("returns 200 for an array of zero or more feeds", async () => {
      const res = await request.get("/api/feeds");
      expect(res.status).toEqual(200);
      expect(Array.isArray(res.body.feeds)).toBe(true);
    });
    it("returns 200 for creating a feed with a valid feed url", async () => {
      const getCat = await request.get("/api/categories");
      const categoryId = getCat.body.categories[0]["_id"];
      const validFeedURL = "https://www.reddit.com/.rss";

      const payload = {
        url: validFeedURL,
        title: "testingTitle",
        category: [categoryId],
      };
      const res = await request
        .post("/api/feeds")
        .send(payload)
        .set("Cookie", cookie);
      feedId = res.body.id;
      expect(res.status).toEqual(200);
      expect(res.body.id).toBeDefined();
    });
    it("returns 400 for creating a duplicate global feed", async () => {
      const getCat = await request.get("/api/categories");
      const categoryId = getCat.body.categories[0]["_id"];
      const validFeedURL = "https://www.reddit.com/.rss";

      const payload = {
        url: validFeedURL,
        title: "testingTitle",
        category: [categoryId],
      };
      const res = await request
        .post("/api/feeds")
        .send(payload)
        .set("Cookie", cookie);

      expect(res.status).toEqual(400);
    });
    it("returns 400 for trying to create feed with invalid feed url", async () => {
      const getCat = await request.get("/api/categories");
      const categoryId = getCat.body.categories[0]["_id"];

      const payload = {
        url: "https://test.com",
        title: "testingTitle",
        category: [categoryId],
      };
      const res = await request
        .post("/api/feeds")
        .send(payload)
        .set("Cookie", cookie);
      console.log(res.body);
      expect(res.status).toEqual(400);
    });
    it("returns 200 for looking up a feed by id", async () => {
      const res = await request.get(`/api/feed/${feedId}`);
      expect(res.status).toEqual(200);
      expect(res.body).toHaveProperty("feed");
      expect(Array.isArray(res.body.feed)).toBe(true);
    });
    it("returns 404 for looking up a feed with an invalid id", async () => {
      const res = await request.get(`/api/feed/${feedId}x`);
      expect(res.status).toEqual(404);
    });
    it("returns 200 for editng a feed title", async () => {
      const payload = {
        title: "testingTitle_changed",
      };
      const res = await request
        .put(`/api/feed/${feedId}`)
        .send(payload)
        .set("Cookie", cookie);
      expect(res.status).toEqual(200);
      expect(res.body.isSuccess).toBe(true);
      const res2 = await request.get(`/api/feed/${feedId}`);
      expect(res2.body.feed[0].title).toMatch(/testingTitle_changed/i);
    });
    it("returns 200 for deleting a feed", async () => {
      const res = await request
        .delete(`/api/feed/${feedId}`)
        .set("Cookie", cookie);
      expect(res.status).toEqual(200);
      expect(res.body.isSuccess).toBe(true);
    });
    it("returns 404 for deleting a feed with an invalid id", async () => {
      const res = await request
        .delete(`/api/feed/${feedId}x`)
        .set("Cookie", cookie);
      expect(res.status).toEqual(404);
    });
  });
  describe("Api users end point", () => {
    let userId: string;

    it("returns 200 for an array of zero or more users", async () => {
      const res = await request.get("/api/users").set("Cookie", cookie);
      expect(res.status).toEqual(200);
      expect(Array.isArray(res.body.users)).toBe(true);
    });
    it("returns 200 for created user", async () => {
      const payload = {
        first_name: "greg",
        last_name: "bob",
        email: "bob@mail.com",
        password: "testing123",
      };
      const res = await request.post("/api/users").send(payload);
      expect(res.status).toEqual(200);
      expect(res.body.id).toBeDefined();
      userId = res.body.id;
    });
    it("returns 400 for invalid payload when creating user", async () => {
      const payload = {
        first_name: "gg",
        last_name: "s  ",
        email: "bob@mail.com",
        password: "test",
      };
      const res = await request.post("/api/users").send(payload);
      expect(res.status).toEqual(400);
    });
    it("returns 200 for looking up a user by id", async () => {
      const res = await request
        .get(`/api/user/${userId}`)
        .set("Cookie", cookie);
      expect(res.status).toEqual(200);
      expect(Array.isArray(res.body.user)).toBe(true);
    });
    it("returns 200 for deleting a user by id", async () => {
      const res = await request
        .delete(`/api/user/${userId}`)
        .set("Cookie", cookie);
      expect(res.status).toEqual(200);

      const res2 = await request
        .get(`/api/user/${userId}`)
        .set("Cookie", cookie);
      expect(res2.status).toEqual(404);
    });
  });
  describe("Api user's feeds end point", () => {
    let userId: string;
    let userFeedId: string;
    let userFeedItemId: string;

    it("return user's feeds", async () => {
      const payload = {
        first_name: "greg",
        last_name: "bob",
        email: "bob@mail.com",
        password: "testing123",
      };
      const create_user = await request
        .post("/api/users")
        .send(payload)
        .set("Cookie", cookie);
      expect(create_user.status).toEqual(200);
      userId = create_user.body.id;

      const res = await request
        .get(`/api/user/${userId}/feeds`)
        .set("Cookie", cookie);
      expect(res.status).toEqual(200);
      expect(res.body.user_feeds).toBeDefined();
    });
    it("returns user's saved feed items", async () => {
      const res = await request
        .get(`/api/user/${userId}/saved-feed-items`)
        .set("Cookie", cookie);
      expect(res.status).toEqual(200);
      expect(res.body.saved_feed_items).toBeDefined();
    });
    it("returns 200 after adding/creating to user feeds", async () => {
      const payload = {
        url: "https://www.reddit.com/.rss",
        title: "test_title",
        is_pinned: false,
        category: ["673a5c920d8e26f372769193"],
        owner: userId,
      };
      const res = await request
        .post(`/api/user/${userId}/feeds`)
        .send(payload)
        .set("Cookie", cookie);
      expect(res.status).toEqual(200);
      userFeedId = res.body.id;
    });
    it("returns 400 after adding/creating to user feeds with duplicate feed url", async () => {
      const payload = {
        url: "https://www.reddit.com/.rss/",
        title: "test_title",
        is_pinned: false,
        category: ["673a5c920d8e26f372769193"],
        owner: userId,
      };
      const res = await request
        .post(`/api/user/${userId}/feeds`)
        .send(payload)
        .set("Cookie", cookie);
      expect(res.status).toEqual(400);
    });
    it("returns 400 after adding/creating to user feeds with invalid feed url", async () => {
      const payload = {
        url: "https://example.com",
        title: "test_title",
        is_pinned: false,
        category: ["673a5c920d8e26f372769193"],
        owner: userId,
      };
      const res = await request
        .post(`/api/user/${userId}/feeds`)
        .send(payload)
        .set("Cookie", cookie);
      expect(res.status).toEqual(400);
    });
    return;
    it("returns 200 after getting user feed by id", async () => {
      const res = await request
        .get(`/api/user/${userId}/feed/${userFeedId}`)
        .set("Cookie", cookie);
      expect(res.status).toEqual(200);
      expect(res.body.user_feed).toBeDefined();
    });
    it("returns 404 after getting user feed by an invalid id", async () => {
      const res = await request
        .get(`/api/user/${userId}/feed/${userFeedId + "5"}`)
        .set("Cookie", cookie);
      expect(res.status).toEqual(404);
    });
    it("returns 200 after creating a user feed item", async () => {
      const payload = {
        feed_title: "my Feed title",
        owner: userId,
        date_added: "2024-11-20T02:25:49.741Z",
        data: {
          title: "test",
          id: 5,
          pubDate: "2020-09-10T00:00:00.000Z",
          content_snippet: "content",
          source_link: "https://reddit.com/.rss",
          content: "",
          image_url: "",
          author: "",
        },
      };
      const res = await request
        .post(`/api/user/${userId}/saved-feed-items`)
        .send(payload)
        .set("Cookie", cookie);
      expect(res.status).toEqual(200);
      userFeedItemId = res.body.id;
    });
    it("returns 200 after getting user feed item by id", async () => {
      const res = await request
        .get(`/api/user/${userId}/saved-feed-item/${userFeedItemId}`)
        .set("Cookie", cookie);
      expect(res.status).toEqual(200);
      expect(res.body.errors).not.toBeDefined();
    });
    it("returns 200 after deleting user feed", async () => {
      const res = await request
        .delete(`/api/user/${userId}/feed/${userFeedId}`)
        .set("Cookie", cookie);
      expect(res.status).toEqual(200);
      expect(res.body.errors).not.toBeDefined();
    });
    it("returns 404 after attempting to delete user feed with invalid id", async () => {
      const res = await request
        .delete(`/api/user/${userId}/feed/${userFeedId + "2"}`)
        .set("Cookie", cookie);
      expect(res.status).toEqual(404);
    });
    it("returns 200 after deleting user feed item", async () => {
      const res = await request
        .delete(`/api/user/${userId}/saved-feed-item/${userFeedItemId}`)
        .set("Cookie", cookie);
      expect(res.status).toEqual(200);
      expect(res.body.errors).not.toBeDefined();
    });
    it("returns 404 attempting to delete user feed item with invalid id", async () => {
      const res = await request
        .delete(`/api/user/${userId}/saved-feed-item/${userFeedItemId + "3"}`)
        .set("Cookie", cookie);
      expect(res.status).toEqual(404);
    });
  });
});
