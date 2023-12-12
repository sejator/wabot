const { prisma } = require("../../model");
const Joi = require("joi");
const moment = require("moment");
const { strtoupper, strtolower } = require("../../helpers/string");
const { async_password_hash } = require("../../helpers/encryption");

class UserController {
  static async index(req, res, next) {
    const users = await prisma.users.findMany();
    // console.log(users);
    res.render("admin/user/index", {
      title: "Users",
      users: users,
      moment: moment,
    });
  }

  static async edit(req, res, next) {
    const id = req.params.id;
    const user = await prisma.users.findFirst({
      where: {
        id: Number(id),
      },
    });
    if (user == null) {
      return res.redirect("/admin/setting/user");
    }
    // console.log(user);
    res.render("admin/user/edit", {
      title: "Edit User",
      user: user,
    });
  }

  static async update(req, res, next) {
    const userId = Number(req.params.id);
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
      password: Joi.optional(),
      status: Joi.optional(),
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
          status: value.status == "true" ? true : false,
          updatedAt: moment().format(),
        },
      });

      if (value.password != "") {
        await prisma.users.update({
          where: {
            id: userId,
          },
          data: {
            password: await async_password_hash(value.password),
            updatedAt: moment().format(),
          },
        });
      }

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
}

module.exports = UserController;
