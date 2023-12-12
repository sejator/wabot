const { prisma } = require("../model");
const Joi = require("joi");
const moment = require("moment");
const { uuid } = require("../helpers/string");
const { Socket } = require("../class/Socket");

class MessageController {
  static async index(req, res, next) {
    const userId = req.session.user.userId;
    const messages = await prisma.autoreply.findMany({
      where: {
        userId: userId,
      },
    });

    // console.log(messages);
    res.render("message/index", {
      title: "Message Auto Reply",
      userId: userId,
      messages: messages,
    });
  }

  static async create(req, res, next) {
    const userId = req.session.user.userId;
    const devices = await prisma.devices.findMany({
      where: {
        userId: userId,
        ready: true,
      },
    });

    res.render("message/add-reply", {
      title: "Message",
      userId: userId,
      devices: devices,
    });
  }

  static async store(req, res, next) {
    const userId = req.session.user.userId;
    const schema = Joi.object({
      keyword: Joi.string()
        .required()
        .external(async (value, helpers) => {
          const cek = await prisma.autoreply.findFirst({
            where: {
              keyword: value,
              deviceKey: req.body.device,
            },
          });

          if (cek != null) {
            return helpers.message("Keyword sudah ada");
          }
          return value;
        }),
      pesan: Joi.string().required(),
      device: Joi.allow(),
      tipe: Joi.allow(),
      title: Joi.allow(),
      footer: Joi.allow(),
      button: Joi.allow(),
      list: Joi.allow(),
    });

    try {
      const value = await schema.validateAsync(req.body);
      await MessageController.#insertButton(value, userId);

      return res.status(200).json({
        ok: true,
        errors: null,
        data: {
          message: "Data berhasil disimpan!",
        },
      });
    } catch (e) {
      console.log(e);
      if (e.details == undefined) {
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

  static async #insertButton(value, userId) {
    return await prisma.$transaction(async (tx) => {
      // simpan pesan textnya
      let buttonreply = {
        createMany: {
          data: [],
        },
      };

      if (value.tipe == "BUTTON") {
        // pesan berisi button
        if (typeof value.button == "object") {
          value.button.map(async (val, i) => {
            buttonreply.createMany.data.push({
              uuid: uuid.v4(),
              name: val,
              createdAt: moment().format(),
              updatedAt: moment().format(),
              deviceKey: value.device,
            });
          });
        } else {
          buttonreply.createMany.data.push({
            uuid: uuid.v4(),
            name: value.button,
            createdAt: moment().format(),
            updatedAt: moment().format(),
            deviceKey: value.device,
          });
        }
      } else if (value.tipe == "LIST") {
        // pesan berisi list
        if (typeof value.list == "object") {
          value.list.map(async (val, i) => {
            buttonreply.createMany.data.push({
              uuid: uuid.v4(),
              name: val,
              createdAt: moment().format(),
              updatedAt: moment().format(),
              deviceKey: value.device,
            });
          });
        } else {
          buttonreply.createMany.data.push({
            uuid: uuid.v4(),
            name: value.list,
            createdAt: moment().format(),
            updatedAt: moment().format(),
            deviceKey: value.device,
          });
        }
      }

      let reply;
      if (value.tipe == "TEXT") {
        reply = await tx.autoreply.create({
          data: {
            uuid: uuid.v4(),
            deviceKey: value.device,
            type: value.tipe,
            keyword: value.keyword,
            message: value.pesan,
            title: value.title,
            footer: value.footer,
            isGroup: false,
            userId: userId,
          },
        });
      } else {
        reply = await tx.autoreply.create({
          data: {
            uuid: uuid.v4(),
            deviceKey: value.device,
            type: value.tipe,
            keyword: value.keyword,
            message: value.pesan,
            title: value.title,
            footer: value.footer,
            isGroup: false,
            userId: userId,
            buttonreply: buttonreply,
          },
        });
      }

      return reply;
    });
  }

  static async edit(req, res, next) {
    const uuid = req.params.uuid;
    const message = await prisma.autoreply.findFirst({
      where: {
        uuid: uuid,
      },
      include: {
        buttonreply: true,
      },
    });
    if (message == null) {
      return res.redirect("/message/auto-reply");
    }

    const userId = req.session.user.userId;
    const devices = await prisma.devices.findMany({
      where: {
        userId: userId,
        ready: true,
      },
    });

    // console.info(message);
    // console.info(devices);
    res.render("message/edit-reply", {
      title: "Message",
      userId: userId,
      devices: devices,
      message: message,
    });
  }

  static async update(req, res, next) {
    const userId = req.session.user.userId;
    const schema = Joi.object({
      keyword: Joi.string()
        .required()
        .external(async (value, helpers) => {
          const cek = await prisma.autoreply.findFirst({
            where: {
              keyword: value,
              deviceKey: req.body.device,
              id: {
                not: Number(req.body.id_message),
              },
            },
          });

          if (cek != null) {
            return helpers.message("Keyword sudah ada");
          }
          return value;
        }),
      pesan: Joi.string().required(),
      device: Joi.allow(),
      tipe: Joi.allow(),
      title: Joi.allow(),
      footer: Joi.allow(),
      button: Joi.allow(),
      list: Joi.allow(),
      id_message: Joi.allow(),
      id_list: Joi.allow(),
      id_button: Joi.allow(),
    });

    try {
      const value = await schema.validateAsync(req.body);
      await MessageController.#updateButton(value);

      return res.status(200).json({
        ok: true,
        errors: null,
        data: {
          message: "Data berhasil diupdate!",
        },
      });
    } catch (e) {
      console.log(e);
      if (e.details == undefined) {
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

  static async #updateButton(value) {
    return await prisma.$transaction(async (tx) => {
      // simpan pesan textnya
      let buttonreply = {
        createMany: {
          data: [],
        },
      };

      if (value.tipe == "BUTTON") {
        // pesan berisi button
        if (typeof value.button == "object") {
          value.button.map(async (val, i) => {
            if (val != "") {
              buttonreply.createMany.data.push({
                uuid: uuid.v4(),
                name: val,
                createdAt: moment().format(),
                updatedAt: moment().format(),
                deviceKey: value.device,
              });
            }
          });
        } else {
          buttonreply.createMany.data.push({
            uuid: uuid.v4(),
            name: value.button,
            createdAt: moment().format(),
            updatedAt: moment().format(),
            deviceKey: value.device,
          });
        }
      } else if (value.tipe == "LIST") {
        // pesan berisi list
        if (typeof value.list == "object") {
          value.list.map(async (val, i) => {
            if (val != "") {
              buttonreply.createMany.data.push({
                uuid: uuid.v4(),
                name: val,
                createdAt: moment().format(),
                updatedAt: moment().format(),
                deviceKey: value.device,
              });
            }
          });
        } else {
          buttonreply.createMany.data.push({
            uuid: uuid.v4(),
            name: value.list,
            createdAt: moment().format(),
            updatedAt: moment().format(),
            deviceKey: value.device,
          });
        }
      }

      let reply;
      if (value.tipe == "TEXT") {
        reply = await tx.autoreply.update({
          where: {
            id: Number(value.id_message),
          },
          data: {
            keyword: value.keyword,
            message: value.pesan,
            title: value.title,
            footer: value.footer,
          },
        });
      } else {
        await tx.buttonreply.deleteMany({
          where: {
            autoreplyId: Number(value.id_message),
          },
        });

        reply = await tx.autoreply.update({
          where: {
            id: Number(value.id_message),
          },
          data: {
            keyword: value.keyword,
            message: value.pesan,
            title: value.title,
            footer: value.footer,
            buttonreply: buttonreply,
          },
        });
      }

      return reply;
    });
  }

  static async delete(req, res, next) {
    const uuid = req.params.uuid;

    try {
      const message = await prisma.autoreply.findFirstOrThrow({
        where: {
          uuid: uuid,
        },
      });
      await prisma.buttonreply.deleteMany({
        where: {
          autoreplyId: message.id,
        },
      });

      await prisma.autoreply.delete({
        where: {
          uuid: uuid,
        },
      });
      return res.status(204).json({
        ok: true,
        errors: null,
        data: {
          message: "Data berhasil diupdate!",
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(404).json({
        ok: false,
        errors: "Data tidak ditemukan!",
        data: null,
      });
    }
  }

  static async cariKeyword(req, res, next) {
    const query = await prisma.buttonreply.findMany({
      where: {
        name: {
          contains: req.query.keyword,
        },
        deviceKey: req.query.device,
      },
    });

    const result = [];
    query.forEach((el) => {
      result.push({
        key: el.id,
        value: el.name,
      });
    });
    res.json(result);
  }
}

module.exports = MessageController;
