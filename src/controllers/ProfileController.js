const { prisma } = require("../model");
const Joi = require("joi");
const moment = require("moment");
const { strtolower, strtoupper } = require("../helpers/string");
const { async_password_hash, random_string } = require("../helpers/encryption");

class ProfileController {
  static async index(req, res, next) {
    const userId = req.session.user.userId;

    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        whatsapp: true,
        apikeys: {
          select: {
            token: true,
          },
        },
      },
    });

    // console.log(user);
    res.render("profile", { title: "Profile", user: user });
  }

  static async update(req, res, next) {
    const userId = req.session.user.userId;
    const schema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string()
        .email()
        .required()
        .external(async (value, helpers) => {
          const cek = await prisma.users.findFirst({
            where: {
              id: {
                not: userId,
              },
              email: value,
            },
          });

          if (cek != null) {
            return helpers.message("Email sudah terdaftar");
          }
          return value;
        }),
      whatsapp: Joi.string()
        .required()
        .external(async (value, helpers) => {
          const cek = await prisma.users.findFirst({
            where: {
              id: {
                not: userId,
              },
              whatsapp: value,
            },
          });

          if (cek != null) {
            return helpers.message("No Whatsapp sudah terdaftar");
          }
          return value;
        }),
    });

    try {
      const value = await schema.validateAsync(req.body);
      await prisma.users.update({
        where: {
          id: userId,
        },
        data: {
          name: strtoupper(value.name),
          email: strtolower(value.email),
          whatsapp: value.whatsapp,
          updatedAt: moment().format(),
        },
      });

      return res.status(200).json({
        ok: true,
        errors: null,
        data: {
          message: "Data berhasil diupdate!",
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

  static async password(req, res, next) {
    const userId = req.session.user.userId;
    const schema = Joi.object({
      password: Joi.string().min(6).required(),
      konfir_password: Joi.ref("password"),
    });

    try {
      const value = await schema.validateAsync(req.body);
      await prisma.users.update({
        where: {
          id: userId,
        },
        data: {
          password: await async_password_hash(value.password),
          updatedAt: moment().format(),
        },
      });

      return res.status(200).json({
        ok: true,
        errors: null,
        data: {
          message: "Password berhasil diupdate!",
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

  static async token(req, res, next) {
    try {
      const userId = req.session.user.userId;

      await prisma.apikeys.update({
        where: {
          userId: userId,
        },
        data: {
          token: random_string(64),
          createdAt: moment().format(),
        },
      });
      return res.status(200).json({
        ok: true,
        errors: null,
        data: {
          message: "Token berhasil diupdate!",
        },
      });
    } catch (e) {
      return res.status(422).json({
        ok: false,
        errors: e.message,
        data: null,
      });
    }
  }
}

module.exports = ProfileController;
