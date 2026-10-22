import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "../config";

// Prisma 6 "client" engine: talks to Postgres through the pure-JS `pg` driver.
const connectionString = config.databaseUrl.split("?")[0];
export const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
