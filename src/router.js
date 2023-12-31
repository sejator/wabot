const Router = require("express-group-router");
let router = new Router();
const { isLogedin, isAdmin, isAPI } = require("../src/helpers/middleware");

const HomeController = require("./controllers/HomeController");
const AuthController = require("./controllers/AuthController");
const DashboardController = require("./controllers/DashboardController");
const DeviceController = require("./controllers/DeviceController");
const SubscriptionController = require("./controllers/SubscriptionController");
const WebhookController = require("./controllers/WebhookController");
const ProfileController = require("./controllers/ProfileController");
const MessageController = require("./controllers/MessageController");

// Namespace ADMIN
const InvoiceController = require("./controllers/admin/InvoiceController");
const SettingController = require("./controllers/admin/SettingController");
const Device = require("./controllers/admin/DeviceController");
const UserController = require("./controllers/admin/UserController");

// Namespace API
const ApiMessage = require("./controllers/api/Message");
const ApiDevice = require("./controllers/api/Device");

router.get("/", HomeController.index);

// Route Auth
router.group("/auth", [isLogedin], (router) => {
  router.get("/", AuthController.index);
  router.post("/", AuthController.login);
  router.get("/register", AuthController.register);
  router.post("/register", AuthController.prosesRegister);
  router.get("/verifikasi", AuthController.verifikasi);
  router.get("/forgot", AuthController.forgot);
  router.post("/forgot", AuthController.prosesForgot);
  router.get("/change", AuthController.change);
  router.post("/change", AuthController.updatePassword);
  router.get("/logout", AuthController.logout);
});

// Route Dashboard
router.group("/dashboard", [isLogedin], (router) => {
  router.get("/", DashboardController.index);
  router.get("/dokumentasi", DashboardController.dokumentasi);
});

// Route Device
router.group("/device", [isLogedin], (router) => {
  router.get("/", DeviceController.index);
  router.get("/create", DeviceController.create);
  router.post("/create", DeviceController.save);
  router.get("/edit/:uuid", DeviceController.edit);
  router.put("/edit/:uuid", DeviceController.update);
  router.get("/scan/:uuid", DeviceController.scan);
  router.get("/info/:uuid", DeviceController.info);
  router.delete("/delete/:uuid", DeviceController.delete);
});

// Route Subcription
router.group("/subscription", [isLogedin], (router) => {
  router.get("/", SubscriptionController.index);
  router.get("/paket/:uuid", SubscriptionController.paket);
  router.get("/cart", SubscriptionController.cart);
  router.post("/addcart", SubscriptionController.addcart);
  router.get("/checkout", SubscriptionController.checkout);
  router.post("/checkout", SubscriptionController.prosesCheckout);
  router.get("/invoice", SubscriptionController.invoice);
  router.get("/invoice/:uuid", SubscriptionController.detail);
});

// Route Profile
router.group("/profile", [isLogedin], (router) => {
  router.get("/", ProfileController.index);
  router.post("/", ProfileController.update);
  router.post("/password", ProfileController.password);
  router.post("/token", ProfileController.token);
});

// Route Message Auto Reply
router.group("/message", [isLogedin], (router) => {
  router.get("auto-reply", MessageController.index);
  router.get("/auto-reply/create", MessageController.create);
  router.post("/auto-reply/create", MessageController.store);
  router.get("/auto-reply/edit/:uuid", MessageController.edit);
  router.put("/auto-reply/edit/:uuid", MessageController.update);
  router.delete("/auto-reply/delete/:uuid", MessageController.delete);
  router.get("/auto-reply/search", MessageController.cariKeyword);
});

// Route untuk ADMIN
router.group("/admin", [isLogedin, isAdmin], (router) => {
  router.group("/device", [isLogedin], (router) => {
    router.get("/", Device.index);
    router.get("/edit/:uuid", Device.edit);
    router.put("/edit/:uuid", Device.update);
    router.delete("/delete/:uuid", Device.delete);
  });

  router.group("/invoice", (router) => {
    router.get("/", InvoiceController.index);
    router.get("/:uuid", InvoiceController.detail);
    router.post("/konfirmasi", InvoiceController.konfirmasi);
  });

  router.group("/setting", (router) => {
    // menu
    router.get("/", SettingController.index);
    router.get("/menu", SettingController.menu);
    router.post("/menu", SettingController.saveMenu);
    router.put("/menu", SettingController.updateMenu);
    router.get("/menu/search", SettingController.searchMenu);

    // submenu
    router.get("/menu/:id/submenu", SettingController.submenu);
    router.post("/submenu", SettingController.saveSubmenu);
    router.put("/submenu", SettingController.updateSubmenu);

    // usermenu
    router.get("/usermenu", SettingController.usermenu);
    router.post("/usermenu", SettingController.saveUsermenu);
    router.get("/usermenu/:roleId", SettingController.listUsermenu);
    router.delete("/usermenu/:id", SettingController.deleteUsermenu);
    // users
    router.group("/user", [isLogedin], (router) => {
      router.get("/", UserController.index);
      router.get("/edit/:id", UserController.edit);
      router.put("/edit/:id", UserController.update);
    });
  });
});

// Untuk test webhook
router.group("/webhook", (router) => {
  router.post("/", WebhookController.index);
  router.post("/test", WebhookController.test);
});

// Endpoint Akses API
router.group("/v1", [isAPI], (router) => {
  router.group("/message", (router) => {
    router.post("/send-text", ApiMessage.sendText);
    router.post("/send-image", ApiMessage.sendImage);
    router.post("/send-image", ApiMessage.sendImage);
    router.post("/send-video", ApiMessage.sendVideo);
    router.post("/send-document", ApiMessage.sendDocument);
  });
  router.group("/device", (router) => {
    router.get("/", ApiDevice.index);
    router.get("/:uuid", ApiDevice.show);
    router.get("/:uuid/init", ApiDevice.init);
    router.get("/:uuid/scan", ApiDevice.scan);
    router.post("/", ApiDevice.create);
    router.delete("/:uuid/logout", ApiDevice.logout);
  });
});

const listRoutes = router.init();

module.exports = listRoutes;
