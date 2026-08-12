// This file initializes the Prisma Client for database interactions with MariaDB. It imports the PrismaClient class from the @prisma/client package, creates an instance of it, and exports the instance for use in other parts of the application. This allows for easy access to the database throughout the application while maintaining a single instance of the Prisma Client.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
