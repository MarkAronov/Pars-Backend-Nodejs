import type { Server } from "node:http";
import { afterAll, afterEach, beforeAll } from "vitest";
import supertest from 'supertest';

import app from "../src/app";
import * as db from "./database";
import { connect, closeDatabase, clearDatabase } from './database';

export const request = supertest;

let server: Server;

beforeAll(async () => {
	await connect();
	await clearDatabase();
	server = app.listen(0);
});

afterEach(async () => {
	await clearDatabase();
});

afterAll(async () => {
	await closeDatabase();
	server.close();
});
