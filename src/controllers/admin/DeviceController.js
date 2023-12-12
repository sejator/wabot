const { prisma } = require("../../model");
const Joi = require("joi");
const moment = require("moment");
const { strtoupper } = require("../../helpers/string");
const { Socket } = require("../../class/Socket");

class DeviceController {
  static async index(req, res, next) {
    const devices = await prisma.devices.findMany();
    res.render("admin/device/index", {
      title: "Device",
      devices: devices,
      moment: moment,
    });
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
    res.render("admin/device/edit", {
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

      return res.status(200).json({
        ok: true,
        errors: null,
        data: {
          message: "Data berhasil diupdate!",
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
      await prisma.devices.delete({
        where: {
          uuid: uuid,
        },
      });

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
