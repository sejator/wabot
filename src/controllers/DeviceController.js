const { prisma } = require("../model");
const Joi = require("joi");
const moment = require("moment");
const { strtoupper, RandomString, uuid } = require("../helpers/string");
const { Socket } = require("../class/Socket");

class DeviceController {
  static async index(req, res, next) {
    const user = req.session.user;
    const devices = await prisma.devices.findMany({
      where: { userId: user.userId },
    });
    // console.log(devices);
    res.render("device/index", {
      title: "Device",
      devices: devices,
      moment: moment,
    });
  }

  static async create(req, res, next) {
    const session = req.session.user;
    res.render("device/create", {
      title: "Tambah Device",
      userId: session.userId,
    });
  }

  static async save(req, res, next) {
    const schema = Joi.object({
      name: Joi.string().required(),
      userId: Joi.number().integer(),
      number: Joi.string()
        .required()
        .external(async (value, helpers) => {
          const cek = await prisma.devices.findFirst({
            where: { number: value },
          });

          if (cek != null) {
            return helpers.message("No Whatsapp sudah terdaftar");
          }
          return value;
        }),
    });

    try {
      const value = await schema.validateAsync(req.body);
      const key = RandomString(8);
      await prisma.devices.create({
        data: {
          uuid: uuid.v4(),
          key: key,
          name: strtoupper(value.name),
          number: value.number,
          ready: false,
          userId: value.userId,
          expired: moment().add(7, "d").unix(),
          createdAt: moment().format(),
          updatedAt: moment().format(),
        },
      });

      return res.status(200).json({
        ok: true,
        errors: null,
        data: {
          message: "Data berhasil disimpan!",
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

  static async edit(req, res, next) {
    const uuid = req.params.uuid;
    const device = await prisma.devices.findUnique({
      where: {
        uuid: uuid,
      },
    });
    if (device == null) {
      return res.redirect("/device");
    }
    // console.log(device);
    res.render("device/edit", {
      title: "Edit Device",
      device: device,
    });
  }

  static async update(req, res, next) {
    const uuid = req.params.uuid;
    const user = req.session.user;

    const schema = Joi.object({
      key: Joi.allow(),
      name: Joi.string(),
      webhook: Joi.allow(),
      url: Joi.allow(),
      number: Joi.string()
        .allow()
        .external(async (value, helpers) => {
          const cek = await prisma.devices.findFirst({
            where: {
              number: value,
              userId: {
                not: user.userId,
              },
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
      const device = await prisma.devices.update({
        where: {
          uuid: uuid,
        },
        data: {
          name: strtoupper(value.name),
          number: value.number,
          webhook: value.webhook == undefined ? false : true,
          webhook_url: value.webhook_url,
          updatedAt: moment().format(),
        },
      });

      if (device.ready) {
        Socket.delete(device.key); // otomatis di logout setelah update data
      }
      return res.status(200).json({
        ok: true,
        errors: null,
        data: {
          message: "Data berhasil diupdate, Silahkan scan QR kembali untuk login!",
          device: device,
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

  static async scan(req, res, next) {
    const uuid = req.params.uuid;
    const device = await prisma.devices.findFirst({
      where: {
        uuid: uuid,
      },
      select: {
        name: true,
        uuid: true,
        key: true,
        ready: true,
      },
    });

    // console.log(device);
    res.render("device/scan", {
      title: "Device",
      device: device,
    });
  }

  static async info(req, res, next) {
    const uuid = req.params.uuid;

    try {
      const device = await prisma.devices.findFirst({
        where: {
          uuid: uuid,
        },
        select: {
          uuid: true,
          key: true,
        },
      });
      if (device === null) throw new Error(`Device tidak ditemukan`);

      const data = await Socket.info(device.key);
      return res.status(200).json({
        ok: true,
        errors: null,
        data: data,
      });
    } catch (e) {
      return res.status(404).json({
        ok: false,
        errors: e.message,
        data: null,
      });
    }
  }

  static async delete(req, res, next) {
    const uuid = req.params.uuid;

    try {
      const device = await prisma.devices.findFirst({
        where: {
          uuid: uuid,
        },
        select: {
          id: true,
          key: true,
        },
      });

      if (device === null) throw new Error(`Device tidak ditemukan`);
      await Socket.delete(device.key);

      return res.status(204).json({
        ok: true,
        errors: null,
        data: {
          message: "Device berhasil dihapus",
        },
      });
    } catch (e) {
      console.log(e);
      return res.status(404).json({
        ok: false,
        errors: e.message,
        data: null,
      });
    }
  }
}

module.exports = DeviceController;
