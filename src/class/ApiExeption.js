class ApiExeption extends Error {
  constructor(message, status = 200) {
    super(message);
    this.status = status;
  }
}

module.exports = ApiExeption;
