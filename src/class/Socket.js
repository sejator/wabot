const { prisma } = require("../model");
const { WhatsAppInstance } = require("./WhatsAppInstance");
const ApiExeption = require("./ApiExeption");

class Socket {
  static io = null;

  /**
   *
   * @param {Client} socket Client Socket IO
   */
  static async init(socket) {
    this.io = socket;
    // mulai scan
    socket.on("scan", (data) => {
      this.#scan(data, socket);
    });

    socket.on("qr", (data) => {
      this.#qrCode(data, socket);
    });
  }

  static async #scan(data, socket) {
    const { uuid } = data;
    const device = await prisma.devices.findFirst({
      where: {
        uuid: uuid,
      },
      select: {
        key: true,
        uuid: true,
        webhook: true,
        url: true,
        name: true,
        number: true,
      },
    });

    const instance = new WhatsAppInstance(device, socket);
    await instance.init();
    WhatsAppInstance[device.key] = instance;

    socket.emit("init", device.key);
  }

  static async #qrCode(data, socket) {
    const { key } = data;
    try {
      const qrcode = await WhatsAppInstance[key]?.instance.qr;
      socket.emit("qr", { url: qrcode });
      socket.emit("message", "Silahkan Scan QR Code diatas!");
    } catch {
      console.log(e);
      socket.emit("message", e);
    }
  }

  static async restoreSessions() {
    try {
      const devices = await prisma.devices.findMany({
        where: {
          ready: true,
        },
        select: {
          key: true,
          uuid: true,
          webhook: true,
          url: true,
          name: true,
          number: true,
        },
      });

      devices.forEach((device, i) => {
        let delay = 5000 * i;
        setTimeout(async () => {
          const instance = new WhatsAppInstance(device);
          await instance.init();
          WhatsAppInstance[device.key] = instance;
          console.log(`Reconnecting session ${device.key}`);
        }, delay);
      });
    } catch (e) {
      console.error("Error restoring sessions");
      console.info(e);
    }
  }

  static async info(key) {
    const instance = WhatsAppInstance[key];
    if (instance == undefined) throw new ApiExeption("Device tidak ditemukan", 404);

    try {
      return await instance.getInstanceDetail(key);
    } catch (error) {
      throw new ApiExeption(error.output.payload.message, error.output.statusCode);
    }
  }

  static async delete(key) {
    const instance = WhatsAppInstance[key];
    if (instance == undefined) return true;

    try {
      await instance.deleteInstance(key);
      return delete WhatsAppInstance[key];
    } catch (error) {
      throw new ApiExeption(error.output.payload.message, error.output.statusCode);
    }
  }

  static async listGroup(key) {
    const instance = WhatsAppInstance[key];
    if (instance == undefined) throw new ApiExeption("Device tidak ditemukan", 404);

    try {
      return await instance.groupFetchAllParticipating();
    } catch (error) {
      throw new ApiExeption(error.output.payload.message, error.output.statusCode);
    }
  }

  /**
   *
   * @param {*} key
   * @param {*} to
   * @param {*} message
   * @param {*} isGroup
   * @returns
   */
  static async sendText(key, to, message, isGroup) {
    const instance = WhatsAppInstance[key];
    if (instance == undefined) throw new ApiExeption("Device tidak ditemukan", 404);

    try {
      return await instance.sendText(to, message, isGroup);
    } catch (error) {
      throw new ApiExeption(error.output.payload.message, error.output.statusCode);
    }
  }

  /**
   *
   * @param {*} params
   * @returns
   */
  static async sendImage(key, to, isGroup, image, caption) {
    const instance = WhatsAppInstance[key];
    if (instance == undefined) throw new ApiExeption("Device tidak ditemukan", 404);

    try {
      return await instance.sendImage(to, isGroup, image, caption);
    } catch (error) {
      throw new ApiExeption(error.output.payload.message, error.output.statusCode);
    }
  }

  static async sendVideo(key, to, isGroup, video, caption) {
    const instance = WhatsAppInstance[key];
    if (instance == undefined) throw new ApiExeption("Device tidak ditemukan", 404);

    try {
      return await instance.sendVideo(to, isGroup, video, caption);
    } catch (error) {
      throw new ApiExeption(error.output.payload.message, error.output.statusCode);
    }
  }

  static async sendDocument(key, to, isGroup, document, caption) {
    const instance = WhatsAppInstance[key];
    if (instance == undefined) throw new ApiExeption("Device tidak ditemukan", 404);

    try {
      return await instance.sendDocument(to, isGroup, document, caption);
    } catch (error) {
      throw new ApiExeption(error.output.payload.message, error.output.statusCode);
    }
  }
}

exports.Socket = Socket;
