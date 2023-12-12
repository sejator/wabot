const { prisma } = require("../model");
const moment = require("moment");
const { uuid } = require("../helpers/string");

class SubscriptionController {
  static async index(req, res, next) {
    const user = req.session.user;
    const devices = await prisma.devices.findMany({
      where: {
        userId: user.userId,
      },
      select: {
        uuid: true,
        key: true,
        name: true,
        number: true,
        expired: true,
      },
    });

    // console.log(devices);
    res.render("subscription/index", {
      title: "Pembelian",
      devices: devices,
      moment: moment,
    });
  }

  static async paket(req, res, next) {
    const uuid = req.params.uuid;
    const device = await prisma.devices.findFirst({
      where: { uuid: uuid },
    });
    if (device == null) {
      res.redirect("/dashboard");
    }
    const pakets = await prisma.pakets.findMany();

    res.render("subscription/paket", {
      title: "Paket Harga",
      device: device,
      pakets: pakets,
    });
  }

  static async addcart(req, res, next) {
    // session cart
    const user = req.session.user;
    const { paketId, devicesKey } = req.body;
    await prisma.carts.create({
      data: {
        paketId: parseInt(paketId),
        devicesKey: devicesKey,
        userId: user.userId,
      },
    });
    // arahin ke hlaman checkout
    return res.status(200).json({
      ok: true,
      errors: null,
      data: {
        message: "Berhasil ditambahkan!",
      },
    });
  }

  static async cart(req, res, next) {
    const user = req.session.user;
    const cart = await prisma.carts.findMany({
      where: {
        userId: user.userId,
      },
      select: {
        id: true,
        devicesKey: true,
        paket: {
          select: {
            name: true,
            harga: true,
            diskon: true,
            durasi: true,
          },
        },
      },
    });
    // console.log(cart);
    res.render("subscription/cart", {
      title: "Cart",
      cart: cart,
    });
  }

  static async checkout(req, res, next) {
    const user = req.session.user;
    const cart = await prisma.carts.findMany({
      where: {
        userId: user.userId,
      },
      select: {
        id: true,
        devicesKey: true,
        paketId: true,
        paket: {
          select: {
            name: true,
            harga: true,
            diskon: true,
            durasi: true,
          },
        },
      },
    });
    // console.log(cart);

    if (cart.length == 0) {
      return res.redirect("/dashboard");
    }
    const banks = await prisma.banks.findMany();

    res.render("subscription/checkout", {
      title: "Checkout",
      cart: cart,
      banks: banks,
    });
  }

  static async prosesCheckout(req, res, next) {
    const user = req.session.user;
    const kode = await SubscriptionController.#generateInvoice();
    const { deviceKey, paketId, bankId, total } = req.body;

    const invoice = await prisma.invoices.create({
      data: {
        uuid: uuid.v4(),
        kode: kode,
        deviceKey: deviceKey,
        paketId: parseInt(paketId),
        bankId: parseInt(bankId),
        userId: user.userId,
        total: parseInt(total),
        expired: moment().add(24, "hours").unix(),
        createdAt: moment().format(),
        updatedAt: moment().format(),
      },
    });

    if (invoice !== null) {
      await prisma.carts.deleteMany({
        where: {
          userId: user.userId,
        },
      });
    }

    // arahin ke hlaman checkout
    return res.status(200).json({
      ok: true,
      errors: null,
      data: {
        message: "Checkout berhasil!",
        uuid: invoice.uuid,
      },
    });
  }

  static async invoice(req, res, next) {
    const user = req.session.user;
    const invoices = await prisma.invoices.findMany({
      where: {
        userId: user.userId,
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

    // console.log(invoices);
    res.render("subscription/invoice", {
      title: "Invoice",
      invoices: invoices,
      moment: moment,
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
      return res.redirect("/invoice");
    }
    // console.log(invoice);
    res.render("subscription/detail", {
      title: "Detail Invoice",
      invoice: invoice,
      moment: moment,
      wa_admin: process.env.WA_ADMIN,
    });
  }

  static async #generateInvoice() {
    const query = await prisma.invoices.aggregate({
      _max: {
        kode: true,
      },
    });

    const max = query._max.kode;
    let kode = null;
    if (max == null) {
      kode = "INV00001";
    } else {
      const number = max.replace(/\D/g, "");
      let int = parseInt(number) + 1;
      if (int < 9) {
        kode = `INV0000${int}`;
      } else if (int < 99) {
        kode = `INV000${int}`;
      } else if (int < 999) {
        kode = `INV00${int}`;
      } else if (int < 9999) {
        kode = `INV0${int}`;
      } else {
        kode = `INV${int}`;
      }
    }
    return kode;
  }
}

module.exports = SubscriptionController;
