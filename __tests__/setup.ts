import type { Server } from "node:http";
import supertest, { type SuperTest, type Test } from "supertest";
import { afterAll, afterEach, beforeAll } from "vitest";

import app from "../src/app";
import * as db from "./database";

let server: Server;
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
let request: any;

beforeAll(async () => {
	await db.connect();
	await db.clearDatabase();
	server = app.listen(0);
	request = supertest(app);
});

afterEach(async () => {
	await db.clearDatabase();
});

afterAll(async () => {
	await db.closeDatabase();
	server.close();
});

export { request };
