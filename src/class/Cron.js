const cron = require("node-cron");
const moment = require("moment");
const { prisma } = require("../model");
const { Socket } = require("./Socket");

class Cron {
  deviceExpired() {
    // cronjob setiap jam 01.05 menit untuk update device yang expired
    cron.schedule(
      "5 1 * * *",
      async () => {
        await this.#updateDevice();
      },
      {
        scheduled: true,
        timezone: "Asia/Jakarta",
      }
    );
  }

  async #updateDevice() {
    const timestamp = moment().unix();
    const devices = await prisma.devices.findMany({
      where: {
        expired: {
          lt: timestamp,
        },
        ready: true,
      },
      select: {
        key: true,
      },
    });

    devices.forEach(async (device) => {
      await Socket.delete(device.key);
    });
  }
}

module.exports = Cron;
