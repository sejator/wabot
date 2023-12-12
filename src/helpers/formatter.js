const formatWhatsapp = function (number) {
  // 1. Menghilangkan karakter selain angka
  let formatted = number.replace(/\D/g, "");

  // 2. Menghilangkan angka 0 di depan (prefix)
  //    Kemudian diganti dengan 62
  if (formatted.startsWith("0")) {
    formatted = "62" + formatted.substr(1);
  }

  if (!formatted.endsWith("@c.us")) {
    formatted += "@c.us";
  }

  return formatted;
};

const formatWhatsappGroup = function (id) {
  let formatted = id;

  if (!formatted.endsWith("@g.us")) {
    formatted += "@g.us";
  }

  return formatted;
};

const formatNoTelp = function (number) {
  // 1. Menghilangkan karakter selain angka
  let no_telp = number.replace(/\D/g, "");

  // 2. Menghilangkan angka 0 di depan (prefix)
  //    Kemudian diganti dengan 62
  if (no_telp.startsWith("62")) {
    no_telp = "0" + no_telp.substr(2);
  }

  return no_telp;
};

const formatPesanWhatsapp = function (string) {
  const encode = encodeURIComponent(string);
  // ganti caracter newline \n jadi 0A khusus pesan whatsapp
  let message = encode.replace(/(5Cr|5Cn)/g, "0A");
  message = message.replace(/(%3A)/g, ":");
  message = message.replace(/(%2F)/g, "/");
  message = message.replace(/(%2C)/g, ",");
  message = message.replace(/(%3F)/g, "?");
  message = message.replace(/(%3D)/g, "=");
  message = message.replace(/(%40)/g, "@");
  return decodeURI(message);
};

module.exports = {
  formatWhatsapp,
  formatWhatsappGroup,
  formatNoTelp,
  formatPesanWhatsapp,
};
