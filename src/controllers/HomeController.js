class HomeController {
  static index(req, res, next) {
    const login = req.session.login ? true : false;
    res.render("home", { title: "Whatsapp API by Sejator", login: login });
  }
}

module.exports = HomeController;
