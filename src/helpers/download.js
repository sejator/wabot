const axios = require("axios").default;
const { random_string } = require("./encryption");
const { writeFileSync } = require("fs");
const path = require("path");
const ApiExeption = require("../class/ApiExeption");
// const extentions = ["image", "application", "video", "audio", "image/webp", "image/jpg", "image/jpeg", "image/png", "image/gif"];
const extentions = {
  image: ["image/webp", "image/jpg", "image/jpeg", "image/png", "image/gif"],
  video: ["video/mp4", "video/gif", "video/mpeg", "video/3gp"],
  audio: ["audio/mp3", "audio/ogg", "audio/mpeg"],
  document: ["application/pdf", "application/zip", "application/octet-stream", "application/vnd.ms-excel", "text/plain"],
};

/**
 *
 * @param {String} url Url file tujuan untuk didownload
 * @param {String} type file yang di download [image, video, audio, document]
 * @param {Boolean} save jika false maka file akan teruskan dalam format base64
 * @returns
 */
async function downloadFile(url, type, save = true) {
  if (url == "" || url == undefined || type == "" || type == undefined) throw new ApiExeption("Parameter tidak valid!", 400);

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      responseType: "arraybuffer",
    });

    // console.log(response.headers);

    const mimetype = response.headers["content-type"];
    if (!extentions[type].includes(mimetype)) throw new ApiExeption("File media tidak valid!", 400);
    const ext = response.request.path.split(".").pop().split("?").shift();
    const filename = `${random_string(32)}.${ext}`;

    // console.log(filename);

    // jika file hanya di teruskan
    if (!save)
      return {
        ok: true,
        errors: null,
        data: {
          mimetype: mimetype,
          name: filename,
          file: response.data.toString("base64"),
          url: url,
        },
      };

    // default file disimpan sementara di temporary
    writeFileSync(path.resolve(`temp/${filename}`), response.data);
    return {
      ok: true,
      errors: null,
      data: {
        mimetype: mimetype,
        name: filename,
        file: path.resolve(`temp/${filename}`),
        url: url,
      },
    };
  } catch (error) {
    // error response
    if (error.response) throw new ApiExeption(`File ${error.response.statusText}`, error.response.status);
    // error request
    else if (error.request) if ("cause" in error) throw new ApiExeption(error.message, 421);
    // else if (error.request) if (error.cause.code == "ENOTFOUND") throw new ApiExeption(error.message, 421);
    // error global
    throw new ApiExeption(error.message, error.status);
  }
}
module.exports = { downloadFile };
