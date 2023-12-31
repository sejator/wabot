const { prisma } = require("../model");
const Joi = require("joi");
let userId = null;

// middleware belum login
function isLogedin(req, res, next) {
  const path = ["auth", "forgot", "register", "verifikasi", "change"];
  const uri = req.url.split("/").pop().split("?")[0];
  // console.log("URI", uri);
  if (req.session.login) {
    // sudah login
    if (path.includes(uri)) return res.redirect("/dashboard");
    return next();
  } else {
    // belum login
    if (path.includes(uri)) return next();
    return res.redirect("/auth");
  }
}

// middleware khusus admin
function isAdmin(req, res, next) {
  const path = ["admin"];
  const uri = req.url.split("/")[1];
  const roleId = req.session.user.roleId;

  // KHUSUS ADMIN
  if (path.includes(uri) && roleId === 1) return next();
  return res.redirect("/dashboard");
}

async function isAPI(req, res, next) {
  const schema = Joi.object()
    .keys({
      authorization: Joi.string().external(async (value, helpers) => {
        if (value === undefined) return helpers.message("Api key tidak valid!");

        const token = await prisma.apikeys.findFirst({
          where: {
            token: value,
          },
        });
        if (token === null) return helpers.message("Api key tidak valid!");
        userId = token.userId;
        return value;
      }),
    })
    .unknown();

  try {
    await schema.validateAsync(req.headers);
    return next();
  } catch (e) {
    const error = e.details.map((d) => d.message.replace(/"/g, "")).join();
    return res.status(401).json({
      ok: false,
      errors: error,
      data: null,
    });
  }
}

function getUserId() {
  return userId;
}

module.exports = { isLogedin, isAdmin, isAPI, getUserId };
