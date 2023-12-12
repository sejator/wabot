const bcrypt = require('bcrypt')
const randomstring = require('randomstring')

const password_hash = (text) => {
  return bcrypt.hashSync(text, 10)
}

const async_password_hash = async (text) => {
  return await bcrypt.hash(text, 10)
}

const password_verify = async (text, hash) => {
  return bcrypt.compareSync(text, hash)
}
const async_password_verify = async (text, hash) => {
  return await bcrypt.compare(text, hash)
}

const random_string = (length = 10, charset = 'alphanumeric', capital = null) => {
  const random = randomstring.generate({
    length: length,
    charset: charset,
    capitalization: capital,
  })
  return random
}

module.exports = { password_hash, async_password_hash, password_verify, async_password_verify, random_string }
