import { PrismaClient } from "@prisma/client";

let db;

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
if (process.env.NODE_ENV === "production") {
  db = new PrismaClient();
  db.$connect();
  console.log("Connected to production DB");
} else {
  if (!global.__db) {
    global.__db = new PrismaClient();
    global.__db.$connect();
    console.log("Reconnected to dev DB");
  }
  db = global.__db;
  console.log("Connected to dev DB");
}

export { db };