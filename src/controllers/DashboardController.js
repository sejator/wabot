const { prisma } = require("../model");

class DashboardController {
  static async index(req, res, next) {
    const userId = req.session.user.userId;
    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
    });

    return res.render("dashboard", { title: "Dashboard", user: user });
  }

  static dokumentasi(req, res, next) {
    const doc = process.env.LINK_DOC_API;
    return res.render("dokumentasi", { title: "Dokumentasi API", doc: doc });
  }
}

module.exports = DashboardController;
