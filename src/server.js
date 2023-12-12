require("dotenv").config();
const fs = require("fs");
const path = require("path");
// check .env config
if (!fs.existsSync(".env")) {
  fs.copyFileSync(path.resolve(".env-sampel"), path.resolve(".env"));
  console.log("----------\nCopy file .env\n----------");
}

const util = require("util");
const dir_log = path.resolve("logs");
const temp = path.resolve("temp");
// create folder logs, untuk simpan log info
if (!fs.existsSync(dir_log)) {
  fs.mkdirSync(dir_log);
}
// create folder temp, untuk simpan hasil download file sementara
if (!fs.existsSync(temp)) {
  fs.mkdirSync(temp);
}
// error log file
fs.createWriteStream(`${dir_log}/error.log`, { flags: "w" });

const log_file = fs.createWriteStream(`${dir_log}/debug.log`, { flags: "w" });
const log_stdout = process.stdout;

const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const logger = require("pino")();
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("@prisma/client");
const listRoutes = require("../src/router");

const { Socket } = require("./class/Socket");

const app = express();
const port = process.env.PORT;

if (process.env.NODE_ENV == "development") {
  const morgan = require("morgan");
  app.use(morgan("dev"));
}

const server = app.listen(port, () => {
  console.info(new Date().toLocaleString("en-US"));
  console.info("Listening on " + port);
  logger.info("Listening on " + port);
});

/**
 * SOCKET.IO
 */
const io = require("socket.io")(server, {
  cors: {
    origin: [process.env.SOCKET_CORS_ORIGIN],
    credentials: true,
  },
});
io.setMaxListeners(0);
// io on connection
io.on("connection", (socket) => {
  // mulai scan
  Socket.init(socket);
});

// middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});

// enable proxy
// app.enable('trust proxy')
// view engine setup
app.set("views", [path.resolve("src/views"), path.resolve("src/views/layouts")]);
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const maxAge = parseInt(process.env.SESSION_EXP) * (24 * 3600 * 1000); // hari
const checkPeriod = parseInt(process.env.SESSION_CHECK_PERIODE) * 60000; // menit
app.use(
  session({
    cookie: {
      maxAge: maxAge,
    },
    secret: process.env.SCREATE_KEY,
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: checkPeriod,
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);
// set static file
app.use("/assets", express.static("public"));

const { menu } = require("./helpers/menu");
app.use(async function (req, res, next) {
  // set session user login
  app.locals.user = req.session.user;
  // set list menu sidebar sesuai yang login
  if (app.locals.sidebar === undefined && req.session.user !== undefined) {
    const roleId = req.session.user.roleId;
    app.locals.sidebar = await menu(roleId);
  }
  next();
});

// semua list routes ada disini
app.use(listRoutes);

const createError = require("http-errors");
const { responseError } = require("./helpers/responseAPI");
const ApiExeption = require("./class/ApiExeption");
app.use(function (req, res, next) {
  // mode development
  if (process.env.NODE_ENV == "development") {
    return next(createError(404));
  }
  // endpoint API
  const uri = req.url.split("/")[1];
  if (uri == "api") {
    return responseError(res, new ApiExeption("Not found", 404));
  }

  // request from web
  return res.render("404", { title: "Not Found" });
});

// debugging aplikasi
console.info = function (d) {
  log_file.write(util.format(d) + "\n");
  log_stdout.write(util.format(d) + "\n");
};

// restore session client whatsapp yang ready setelah server di retart atau start
setTimeout(() => {
  Socket.restoreSessions();
}, process.env.RESTORE_SESSIONS_DELAY * 1000);

// Jalankan Cronjob
const Cron = require("../src/class/Cron");
const cron = new Cron();
cron.deviceExpired();

module.exports = app;
