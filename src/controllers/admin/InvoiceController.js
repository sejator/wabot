const { prisma } = require("../../model");
const moment = require("moment");

class InvoiceController {
  static async index(req, res, next) {
    const { status } = req.query;
    let invoices = [];
    try {
      if (status == "ALL" || status == undefined) {
        invoices = await prisma.invoices.findMany({
          select: {
            id: true,
            uuid: true,
            kode: true,
            status: true,
            total: true,
            expired: true,
            devices: {
              select: {
                key: true,
                name: true,
                number: true,
              },
            },
          },
        });
      } else {
        invoices = await prisma.invoices.findMany({
          where: {
            status: status,
          },
          select: {
            id: true,
            uuid: true,
            kode: true,
            status: true,
            total: true,
            expired: true,
            devices: {
              select: {
                key: true,
                name: true,
                number: true,
              },
            },
          },
        });
      }
    } catch (error) {
      // console.log(error);
    }

    // console.log(invoices);
    res.render("admin/invoice/index", {
      title: "Invoice",
      invoices: invoices,
      moment: moment,
      status: status,
    });
  }

  static async detail(req, res, next) {
    const uuid = req.params.uuid;
    const invoice = await prisma.invoices.findFirst({
      where: {
        uuid: uuid,
      },
      select: {
        id: true,
        uuid: true,
        kode: true,
        total: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        devices: {
          select: {
            name: true,
            key: true,
            number: true,
          },
        },
        paket: {
          select: {
            name: true,
            durasi: true,
          },
        },
        bank: {
          select: {
            name: true,
            kode: true,
            pemilik: true,
            norek: true,
          },
        },
      },
    });

    if (invoice == null) {
      return res.redirect("/admin/invoice");
    }
    // console.log(invoice);
    res.render("admin/invoice/detail", {
      title: "Detail Invoice",
      invoice: invoice,
      moment: moment,
      wa_admin: process.env.WA_ADMIN,
    });
  }

  static async konfirmasi(req, res, next) {
    const { kode, durasi, uuid, key } = req.body;
    const device = await prisma.devices.findFirst({
      where: {
        key: key,
      },
      select: {
        expired: true,
      },
    });
    const expired = moment(device.expired * 1000)
      .add(durasi, "month")
      .unix();
    await prisma.$transaction([
      prisma.invoices.updateMany({
        where: {
          uuid: uuid,
          kode: kode,
        },
        data: {
          status: "PAID",
        },
      }),
      prisma.devices.update({
        where: {
          key: key,
        },
        data: {
          expired: expired,
        },
      }),
    ]);

    return res.status(200).json({
      ok: true,
      errors: null,
      data: {
        message: "Konfirmasi pembayaran berhasil!",
      },
    });
  }
}

module.exports = InvoiceController;
