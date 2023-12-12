const Joi = require("joi");
const ApiExeption = require("../class/ApiExeption");

function responseOK(res, data) {
  return res.json({
    ok: true,
    errors: null,
    data: data,
  });
}

function responseError(res, err) {
  // console.log(err);
  if (err instanceof Joi.ValidationError) {
    const details = err.details.map((d) => d.message.replace(/"/g, "")).join();
    if (err.details[0].type === "external") {
      return res.status(404).json({
        ok: false,
        errors: details,
        data: null,
      });
    } else {
      return res.status(400).json({
        ok: false,
        errors: details,
        data: null,
      });
    }
  } else if (err instanceof ApiExeption) {
    return res.status(err.status).json({
      ok: false,
      errors: err.message,
      data: null,
    });
  } else {
    return res.status(500).json({
      ok: false,
      errors: "Internal Server Error",
      data: null,
    });
  }
}

module.exports = { responseOK, responseError };
