const Joi = require("joi");
const { Socket } = require("../../class/Socket");
const { uuid } = require("../../helpers/string");
const { downloadFile } = require("../../helpers/download");
const moment = require("moment");
const fs = require("fs");
const { prisma } = require("../../model");
const { responseOK, responseError } = require("../../helpers/responseAPI");

class Message {
  static async sendText(req, res, next) {
    const schema = Joi.object({
      key: Joi.string()
        .required()
        .external(async (value, helpers) => {
          const device = await prisma.devices.findFirst({
            where: {
              key: value,
            },
          });

          if (device === null) return helpers.message("Device tidak terdaftar");
          return value;
        }),
      phone: Joi.string().required(),
      message: Joi.string().required(),
      isGroup: Joi.allow(),
      secure: Joi.allow(),
    });

    try {
      const value = await schema.validateAsync(req.body);
      const isGroup = value.isGroup == "true" ? true : false;
      const secure = value.secure == "true" ? true : false;
      const receive = await Socket.sendText(value.key, value.phone, value.message, isGroup);
      const uniq = uuid.v4();
      const number = receive.key?.remoteJid.replace(/\D/g, "");

      // simpan pesan
      Message.#saveMessage(uniq, value, receive);

      return responseOK(res, {
        messages: [
          {
            uuid: uniq,
            phone: number,
            message: value.message,
            status: "PENDING",
            isGroup: isGroup,
            secure: secure,
            timestamp: parseInt(receive.messageTimestamp),
          },
        ],
      });
    } catch (error) {
      // console.log(error)
      return responseError(res, error);
    }
  }

  static async sendImage(req, res, next) {
    const schema = Joi.object({
      key: Joi.string()
        .required()
        .external(async (value, helpers) => {
          const device = await prisma.devices.findFirst({
            where: {
              key: value,
            },
          });

          if (device === null) return helpers.message("Device tidak terdaftar");

          return value;
        }),
      phone: Joi.string().required(),
      image: Joi.string().required(),
      caption: Joi.allow(),
      isGroup: Joi.allow(),
      secure: Joi.allow(),
    });

    let download;
    try {
      const value = await schema.validateAsync(req.body);
      const isGroup = value.isGroup == "true" ? true : false;
      const secure = value.secure == "true" ? true : false;
      download = await downloadFile(value.image, "image");

      const image = fs.readFileSync(download.data.file);
      const receive = await Socket.sendImage(value.key, value.phone, isGroup, image, value.caption);
      const uniq = uuid.v4();
      const number = receive.key?.remoteJid.replace(/\D/g, "");

      // simpan pesan
      Message.#saveMessage(uniq, value, receive);
      // remove media
      Message.#removeFileTemp(download.data.file);
      return responseOK(res, {
        messages: [
          {
            uuid: uniq,
            phone: number,
            caption: value.caption ? value.caption : "",
            image: download.data.name,
            status: "PENDING",
            isGroup: isGroup,
            secure: secure,
            timestamp: parseInt(receive.messageTimestamp),
          },
        ],
      });
    } catch (error) {
      // console.log(error)
      // remove media
      Message.#removeFileTemp(download.data.file);
      return responseError(res, error);
    }
  }

  static async sendVideo(req, res, next) {
    const schema = Joi.object({
      key: Joi.string()
        .required()
        .external(async (value, helpers) => {
          const device = await prisma.devices.findFirst({
            where: {
              key: value,
            },
          });

          if (device === null) return helpers.message("Device tidak terdaftar");

          return value;
        }),
      phone: Joi.string().required(),
      video: Joi.string().required(),
      caption: Joi.allow(),
      isGroup: Joi.allow(),
      secure: Joi.allow(),
    });

    let download;
    try {
      const value = await schema.validateAsync(req.body);
      const isGroup = value.isGroup == "true" ? true : false;
      const secure = value.secure == "true" ? true : false;
      download = await downloadFile(value.video, "video");

      const video = fs.readFileSync(download.data.file);
      const receive = await Socket.sendVideo(value.key, value.phone, isGroup, video, value.caption);
      const uniq = uuid.v4();
      const number = receive.key?.remoteJid.replace(/\D/g, "");

      // simpan pesan
      Message.#saveMessage(uniq, value, receive);
      // remove media
      Message.#removeFileTemp(download.data.file);

      return responseOK(res, {
        messages: [
          {
            uuid: uniq,
            phone: number,
            caption: value.caption ? value.caption : "",
            video: download.data.name,
            status: "PENDING",
            isGroup: isGroup,
            secure: secure,
            timestamp: parseInt(receive.messageTimestamp),
          },
        ],
      });
    } catch (error) {
      // console.log(error);
      // remove media
      Message.#removeFileTemp(download.data.file);
      return responseError(res, error);
    }
  }

  static async sendDocument(req, res, next) {
    const schema = Joi.object({
      key: Joi.string()
        .required()
        .external(async (value, helpers) => {
          const device = await prisma.devices.findFirst({
            where: {
              key: value,
            },
          });

          if (device === null) return helpers.message("Device tidak terdaftar");

          return value;
        }),
      phone: Joi.string().required(),
      document: Joi.string().required(),
      filename: Joi.allow(),
      caption: Joi.allow(),
      isGroup: Joi.allow(),
      secure: Joi.allow(),
    });

    let download;
    try {
      const value = await schema.validateAsync(req.body);
      const isGroup = value.isGroup == "true" ? true : false;
      const secure = value.secure == "true" ? true : false;
      download = await downloadFile(value.document, "document");

      const document = {
        file: fs.readFileSync(download.data.file),
        name: value.filename ? value.filename : download.data.name,
        mimetype: download.data.mimetype,
      };
      const receive = await Socket.sendDocument(value.key, value.phone, isGroup, document, value.caption);
      const uniq = uuid.v4();
      const number = receive.key?.remoteJid.replace(/\D/g, "");

      // simpan pesan
      Message.#saveMessage(uniq, value, receive);
      // remove media
      Message.#removeFileTemp(download.data.file);

      return responseOK(res, {
        messages: [
          {
            uuid: uniq,
            phone: number,
            caption: value.caption ? value.caption : "",
            file: download.data.name,
            status: "PENDING",
            isGroup: isGroup,
            secure: secure,
            timestamp: parseInt(receive.messageTimestamp),
          },
        ],
      });
    } catch (error) {
      // console.log(error);
      // remove media
      Message.#removeFileTemp(download.data.file);
      return responseError(res, error);
    }
  }

  static async #saveMessage(uuid, body, receive) {
    // console.log(body);
    const isGroup = body.isGroup == "true" ? true : false;
    const secure = body.secure == "true" ? true : false;
    // text
    await prisma.messages.create({
      data: {
        uuid: uuid,
        deviceKey: body.key,
        messageId: receive.key.id,
        read: 1,
        noTujuan: receive.key?.remoteJid.replace(/\D/g, ""),
        text: body.message,
        isGroup: isGroup,
        secure: secure,
        timestamp: parseInt(receive.messageTimestamp),
        createdAt: moment().format(),
        updatedAt: moment().format(),
      },
    });
  }

  static #removeFileTemp(path) {
    return fs.unlinkSync(path);
  }
}

module.exports = Message;
