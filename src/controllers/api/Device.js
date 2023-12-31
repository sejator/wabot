const { prisma } = require("../../model");
const Joi = require("joi");
const moment = require("moment");
const { responseOK, responseError } = require("../../helpers/responseAPI");
const { getUserId } = require("../../helpers/middleware");
const { strtoupper, RandomString, uuid } = require("../../helpers/string");
const { WhatsAppInstance } = require("../../class/WhatsAppInstance");
const config = require("../../config/config");
const ApiExeption = require("../../class/ApiExeption");
let instance;

class Device {
  static async index(req, res, next) {
    try {
      const user = await prisma.users.findFirst({
        where: {
          id: getUserId(),
        },
        include: {
          devices: true,
        },
      });
      return responseOK(res, user.devices);
    } catch (error) {
      return responseError(res, error);
    }
  }

  static async create(req, res, next) {
    const schema = Joi.object({
      name: Joi.string().required(),
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
      const device = await prisma.devices.create({
        data: {
          uuid: uuid.v4(),
          key: key,
          name: strtoupper(value.name),
          number: value.number,
          ready: false,
          userId: getUserId(),
          expired: moment().add(7, "d").unix(),
          createdAt: moment().format(),
          updatedAt: moment().format(),
        },
      });

      return responseOK(res, device);
    } catch (error) {
      // console.info(error);
      return responseError(res, error);
    }
  }

  static async show(req, res, next) {
    try {
      const uuid = req.params.uuid;
      const device = await prisma.devices.findUnique({
        where: {
          uuid: uuid,
        },
      });
      if (device == null) {
        return res.status(404).json({
          ok: false,
          errors: ["Device tidak ditemukan"],
          data: null,
        });
      }
      return responseOK(res, device);
    } catch (error) {
      // console.info(error);
      return responseError(res, error);
    }
  }

  static async init(req, res, next) {
    const uuid = req.params.uuid;
    const device = await prisma.devices.findUnique({
      where: {
        uuid: uuid,
      },
    });
    if (device == null) {
      return res.status(404).json({
        ok: false,
        errors: ["Device tidak ditemukan"],
        data: null,
      });
    }

    try {
      if (device.ready) throw new ApiExeption(`Nomor whatsapp <b>${device.number}</b> sudah login.`, 400);
      instance = new WhatsAppInstance(device);
      await instance.init();
      WhatsAppInstance[device.key] = instance;
      return responseOK(res, {
        message: "Inisialisasi berhasil",
        url: `${config.appUrl}/device/${uuid}/qrcode`,
        expired: `${parseInt(config.qrTimout)} detik`,
      });
    } catch (error) {
      // console.log(error);
      return responseError(res, error);
    }
  }

  static async scan(req, res, next) {
    const uuid = req.params.uuid;
    const device = await prisma.devices.findUnique({
      where: {
        uuid: uuid,
      },
    });

    try {
      const qrcode = await WhatsAppInstance[device.key]?.instance.qr;
      if (qrcode == undefined || qrcode == "") throw new ApiExeption("Qrcode belum siap, silahkan Inisialisasi dulu", 400);

      // return res.send(`<img src="${qrcode}" alt="">`);
      return responseOK(res, {
        qrcode: qrcode,
      });
    } catch (error) {
      // console.log(error);
      return responseError(res, error);
    }
  }

  static async logout(req, res, next) {
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

      if (device === null) throw new ApiExeption(`Device tidak ditemukan`, 404);
      instance = WhatsAppInstance[device.key];
      if (instance == undefined) throw new ApiExeption(`Device tidak ditemukan`, 404);

      await instance.deleteInstance(device.key);
      delete WhatsAppInstance[device.key];
      return responseOK(res, { message: "Berhasil keluar dari perangkat" });
    } catch (error) {
      // console.log(error);
      return responseError(res, error);
    }
  }
}

module.exports = Device;
