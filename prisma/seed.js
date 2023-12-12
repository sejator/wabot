const { PrismaClient } = require("@prisma/client");
const moment = require("moment");
const { async_password_hash } = require("../src/helpers/encryption");
const { uuid, ucword, strtolower } = require("../src/helpers/string");
const prisma = new PrismaClient();

async function main() {
  const roles = [
    {
      id: 1,
      name: "ADMIN",
    },
    {
      id: 2,
      name: "USER",
    },
  ];

  roles.forEach(async (val, i) => {
    const role = await prisma.roles.upsert({
      where: { id: val.id },
      update: {},
      create: {
        name: val.name,
        createdAt: moment().format(),
        updatedAt: moment().format(),
      },
    });
    console.log({ role });
  });

  const admin = await prisma.users.upsert({
    where: { email: "sejatordev@gmail.com" },
    update: {},
    create: {
      name: "Sejator",
      email: "sejatordev@gmail.com",
      whatsapp: "081295018034",
      password: await async_password_hash("12345678"),
      status: true,
      roleId: 1,
      createdAt: moment().format(),
      updatedAt: moment().format(),
      apikeys: {
        create: {
          token: "Puk1D7JB79Fq2zZzBQ43EQqzlejp6UhRu2r3QwjN1buKhmiUt4V0HxVVzxkVWH46",
          status: true,
          createdAt: moment().format(),
          updatedAt: moment().format(),
        },
      },
      devices: {
        create: {
          uuid: uuid.v4(),
          key: "S3J4T0RXX",
          name: "WA SENDER",
          number: "085797857209",
          ready: false,
          webhook: false,
          url: null,
          expired: 2068916795, // tahun 2035
          createdAt: moment().format(),
          updatedAt: moment().format(),
        },
      },
    },
  });
  console.log({ admin });
  const pakets = [
    {
      id: 1,
      name: "PAKET 1 BULAN",
      durasi: 1,
      harga: 50000,
      diskon: 30000,
    },
    {
      id: 2,
      name: "PAKET 3 BULAN",
      durasi: 3,
      harga: 70000,
      diskon: 50000,
    },
    {
      id: 3,
      name: "PAKET 6 BULAN",
      durasi: 6,
      harga: 100000,
      diskon: 80000,
    },
  ];

  pakets.forEach(async (val, i) => {
    const row = await prisma.pakets.upsert({
      where: { id: val.id },
      update: {},
      create: {
        id: val.id,
        name: val.name,
        durasi: val.durasi,
        harga: val.harga,
        diskon: val.diskon,
        createdAt: moment().format(),
        updatedAt: moment().format(),
      },
    });
    console.log({ row });
  });

  const banks = [
    {
      id: 1,
      name: "MANDIRI",
      kode: "008",
      pemilik: "MAS RONI",
      norek: "1234567890",
    },
  ];

  banks.forEach(async (val, i) => {
    const bank = await prisma.banks.upsert({
      where: { id: val.id },
      update: {},
      create: {
        id: val.id,
        name: val.name,
        kode: val.kode,
        pemilik: val.pemilik,
        norek: val.norek,
        createdAt: moment().format(),
        updatedAt: moment().format(),
      },
    });
    console.log({ bank });
  });

  const menus = [
    {
      id: 1,
      main: "Dashboard",
      icon: "fe fe-home fe-16",
      link: "dashboard",
      urut: 1,
    },
    {
      id: 2,
      main: "Device",
      icon: "fe fe-smartphone fe-16",
      link: "#",
      urut: 2,
    },
    {
      id: 3,
      main: "Transaction",
      icon: "fe fe-shopping-cart fe-16",
      link: "#",
      urut: 3,
    },
    {
      id: 4,
      main: "Admin",
      icon: "fe fe-user-plus fe-16",
      link: "#",
      urut: 4,
    },
    {
      id: 5,
      main: "Setting",
      icon: "fe fe-settings fe-16",
      link: "#",
      urut: 5,
    },
    {
      id: 6,
      main: "Documentation",
      icon: "fe fe-book fe-16",
      link: "dashboard/dokumentasi",
      urut: 6,
    },
  ];

  const submenus = [
    {
      id: 1,
      sub: "Dashboard",
      link: "dashboard",
      urut: 1,
      menusId: 1,
    },
    {
      id: 2,
      sub: "List",
      link: "device",
      urut: 1,
      menusId: 2,
    },
    {
      id: 3,
      sub: "Subscription",
      link: "subscription",
      urut: 1,
      menusId: 3,
    },
    {
      id: 4,
      sub: "Invoice",
      link: "subscription/invoice",
      urut: 2,
      menusId: 3,
    },
    {
      id: 5,
      sub: "Device",
      link: "admin/device",
      urut: 1,
      menusId: 4,
    },
    {
      id: 6,
      sub: "Invoice",
      link: "admin/invoice",
      urut: 2,
      menusId: 4,
    },
    {
      id: 7,
      sub: "Menu",
      link: "admin/setting/menu",
      urut: 1,
      menusId: 5,
    },
    {
      id: 8,
      sub: "Role Menu",
      link: "admin/setting/usermenu",
      urut: 2,
      menusId: 5,
    },
    {
      id: 9,
      sub: "Users",
      link: "admin/setting/user",
      urut: 3,
      menusId: 5,
    },
    {
      id: 10,
      sub: "Documentation",
      link: "dashboard/dokumentasi",
      urut: 1,
      menusId: 6,
    },
  ];

  menus.forEach(async (val, i) => {
    const row = await prisma.menus.upsert({
      where: { id: val.id },
      update: {},
      create: {
        id: val.id,
        main: ucword(val.main),
        icon: strtolower(val.icon),
        link: strtolower(val.link),
        urut: Number(val.urut),
        createdAt: moment().format(),
        updatedAt: moment().format(),
      },
    });
    console.log({ row });
  });

  submenus.forEach(async (val, i) => {
    const row = await prisma.submenus.upsert({
      where: { id: val.id },
      update: {},
      create: {
        id: Number(val.id),
        sub: ucword(val.sub),
        link: strtolower(val.link),
        urut: Number(val.urut),
        menusId: Number(val.menusId),
        createdAt: moment().format(),
        updatedAt: moment().format(),
      },
    });
    console.log({ row });
  });

  const usermenu = await prisma.submenus.findMany();
  usermenu.forEach(async (val, i) => {
    const rm = await prisma.usermenus.findFirst({
      where: {
        submenusId: Number(val.id),
      },
    });
    if (rm == null) {
      await prisma.usermenus.create({
        data: {
          rolesId: 1,
          submenusId: Number(val.id),
        },
      });
    }
    console.log({ rm });
  });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
