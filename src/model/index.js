const { PrismaClient } = require("@prisma/client");
const config = require("../config/config");

const prisma = new PrismaClient({
  log: config.debugQuery,
});

module.exports = {
  prisma: prisma,
};
