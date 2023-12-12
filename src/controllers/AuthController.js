const { prisma } = require("../model");
const Joi = require("joi");
const moment = require("moment");
const { async_password_hash, random_string, async_password_verify } = require("../helpers/encryption");
const { strtolower, strtoupper } = require("../helpers/string");
const { sendMail } = require("../helpers/notifikasi");
const ejs = require("ejs");
const path = require("path");

class AuthController {
  static index(req, res, next) {
    res.render("auth/login", { title: "Login" });
  }

  static async login(req, res, next) {
    const schema = Joi.object({
      email: Joi.string()
        .email()
        .required()
        .external(async (value, helpers) => {
          const user = await prisma.users.findUnique({
            where: {
              email: value,
            },
          });

          if (user == null) {
            return helpers.message("Email tidak terdaftar");
          }
          return user;
        }),
      password: Joi.string().required(),
    });

    try {
      const { email, password } = await schema.validateAsync(req.body);
      if (email.status == false) {
        return res.status(400).json({
          ok: false,
          errors: [{ message: "Email belum di verifikasi" }],
          data: null,
        });
      }

      if (!(await async_password_verify(password, email.password))) {
        return res.status(400).json({
          ok: false,
          errors: [{ message: "Login gagal!" }],
          data: null,
        });
      }

      // generate session
      req.session.regenerate(function (err) {
        if (err) {
          throw new Error(err);
        }

        // siapkan session user yang login
        req.session.login = true;
        req.session.user = {
          userId: email.id,
          roleId: email.roleId,
        };

        // simpan sessionnya
        req.session.save(function (err) {
          if (err) {
            throw new Error(err);
          }

          return res.status(200).json({
            ok: true,
            errors: null,
            data: {
              message: "OK login sukses!",
            },
          });
        });
      });
    } catch (e) {
      if (e.details == undefined) {
        console.info(e);
        return res.status(500).json({
          ok: false,
          errors: e.message,
          data: null,
        });
      } else {
        const details = e.details.map((val, i) => {
          return { field: val.context.key, value: val.context.value, message: val.message };
        });
        return res.status(400).json({
          ok: false,
          errors: details,
          data: null,
        });
      }
    }
  }

  static async register(req, res, next) {
    res.render("auth/register", { title: "Registrasi" });
  }

  static async prosesRegister(req, res, next) {
    const schema = Joi.object({
      name: Joi.string().required(),
      whatsapp: Joi.string()
        .required()
        .external(async (value, helpers) => {
          const cek = await prisma.users.findFirst({
            where: { whatsapp: value },
          });

          if (cek != null) {
            return helpers.message("No Whatsapp sudah terdaftar");
          }
          return value;
        }),
      email: Joi.string()
        .email()
        .required()
        .external(async (value, helpers) => {
          const cek = await prisma.users.findUnique({
            where: { email: value },
          });

          if (cek != null) {
            return helpers.message("Email sudah terdaftar");
          }
          return value;
        }),
      password: Joi.string().min(6).required(),
      konfir_password: Joi.ref("password"),
    });

    try {
      const value = await schema.validateAsync(req.body);
      const token = random_string(64);

      const data = await prisma.users.upsert({
        where: { email: value.email },
        update: {},
        create: {
          name: strtoupper(value.name),
          email: strtolower(value.email),
          whatsapp: value.whatsapp,
          password: await async_password_hash(value.password),
          key: token,
          status: false,
          roleId: 2,
          createdAt: moment().format(),
          updatedAt: moment().format(),
        },
      });

      delete data.password;
      delete data.key;
      let message;
      ejs.renderFile(path.resolve("src/views/email/verifikasi.ejs"), { token: token, url: process.env.APP_URL }, function (err, str) {
        message = str;
      });
      // kirim email verifkasi
      sendMail(value.email, "VERIFIKSASI EMAIL", message);

      return res.status(201).json({
        ok: true,
        errors: null,
        data: {
          message: "Registrasi berhasil, silahkan cek email kamu untuk verifikasi (pastikan cek juga di folder SPAM)",
        },
      });
    } catch (e) {
      if (e.details == undefined) {
        console.info(e);
        return res.status(500).json({
          ok: false,
          errors: e.message,
          data: null,
        });
      } else {
        const details = e.details.map((val, i) => {
          return { field: val.context.key, value: val.context.value, message: val.message };
        });
        return res.status(400).json({
          ok: false,
          errors: details,
          data: null,
        });
      }
    }
  }

  static async verifikasi(req, res, next) {
    const key = req.query.key;
    const user = await prisma.users.findFirst({
      where: { key: key },
      select: {
        id: true,
        key: true,
      },
    });

    if (user !== null) {
      // update status nya
      await prisma.users.update({
        where: { id: user.id },
        data: {
          status: true,
          key: null,
        },
      });
    }
    res.render("auth/verifikasi", { title: "Verifikasi Email", data: user, url: process.env.APP_URL });
  }

  static async forgot(req, res, next) {
    res.render("auth/forgot", { title: "Lupa Kata Sandi" });
  }

  static async prosesForgot(req, res, next) {
    const schema = Joi.object({
      email: Joi.string()
        .email()
        .required()
        .external(async (value, helpers) => {
          const user = await prisma.users.findUnique({
            where: { email: value },
          });

          if (user == null) {
            return helpers.message("Email tidak terdaftar");
          }
          return user;
        }),
    });

    try {
      const { email } = await schema.validateAsync(req.body);

      if (email.status == false) {
        return res.status(400).json({
          ok: false,
          errors: [{ message: "Email belum di verifikasi" }],
          data: null,
        });
      }
      const token = random_string(64);

      // update status nya
      await prisma.users.update({
        where: { email: email.email },
        data: {
          key: token,
        },
      });

      let message;
      ejs.renderFile(path.resolve("src/views/email/forgot.ejs"), { token: token, url: process.env.APP_URL }, function (err, str) {
        message = str;
      });
      // kirim email forgot password
      sendMail(email.email, "RESET PASSWORD", message);

      return res.status(200).json({
        ok: true,
        errors: null,
        data: {
          message: "Reset Password berhasil, silahkan cek email kamu (pastikan cek juga di folder SPAM)",
        },
      });
    } catch (e) {
      if (e.details == undefined) {
        console.info(e);
        return res.status(500).json({
          ok: false,
          errors: e.message,
          data: null,
        });
      } else {
        const details = e.details.map((val, i) => {
          return { field: val.context.key, value: val.context.value, message: val.message };
        });
        return res.status(400).json({
          ok: false,
          errors: details,
          data: null,
        });
      }
    }
  }

  static async change(req, res, next) {
    const key = req.query.key;
    const user = await prisma.users.findFirst({
      where: { key: key },
      select: {
        id: true,
        key: true,
        name: true,
      },
    });

    res.render("auth/change", { title: "Ubah Kata Sandi", data: user, url: process.env.APP_URL });
  }

  static async updatePassword(req, res, next) {
    const schema = Joi.object({
      password: Joi.string().min(6).required(),
      konfir_password: Joi.ref("password"),
      id: Joi.number().allow(),
      token: Joi.allow(),
    });

    try {
      const value = await schema.validateAsync(req.body);
      await prisma.users.update({
        where: { id: value.id },
        data: {
          key: null,
          password: await async_password_hash(value.password),
        },
      });

      return res.status(200).json({
        ok: true,
        errors: null,
        data: {
          message: "Kata sandi berhasil diubah",
        },
      });
    } catch (e) {
      if (e.details == undefined) {
        console.info(e);
        return res.status(500).json({
          ok: false,
          errors: e.message,
          data: null,
        });
      } else {
        const details = e.details.map((val, i) => {
          return { field: val.context.key, value: val.context.value, message: val.message };
        });
        return res.status(400).json({
          ok: false,
          errors: details,
          data: null,
        });
      }
    }
  }

  static logout(req, res, next) {
    req.session.login = null;
    req.session.user = null;
    req.app.locals.user = null;
    req.app.locals.sidebar = undefined;

    req.session.save(function (err) {
      if (err) next();

      req.session.regenerate(function (err) {
        if (err) next();
        res.redirect("/auth");
      });
    });
  }
}

module.exports = AuthController;
