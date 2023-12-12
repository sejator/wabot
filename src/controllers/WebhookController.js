const axios = require("axios").default;

class WebhookController {
  static async index(req, res, next) {
    const { webhook_url } = req.body;

    try {
      if (webhook_url == "") throw new Error("URL webhook harus diisi.");

      const response = await axios({
        method: "post",
        url: webhook_url,
      });
      // console.log(response);
      res.status(response.status).json(response.data);
    } catch (e) {
      if (e.response) {
        const result = e.response;
        // console.log(result.status);
        res.status(result.status).json(e);
      } else {
        res.status(400).json(e.message);
      }
    }
  }

  static async test(req, res, next) {
    return res.send("OK");
  }
}

module.exports = WebhookController;
