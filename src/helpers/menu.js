const { prisma } = require("../model");

module.exports.menu = async (roleId) => {
  let menus = await prisma.menus.findMany({
    include: {
      submenus: {
        include: {
          usermenus: {
            where: {
              rolesId: roleId,
            },
          },
        },
      },
    },
    orderBy: {
      urut: "asc",
    },
  });

  let listMenu = [];
  menus.forEach((menu) => {
    menu.submenus.forEach((sub) => {
      if (sub.usermenus.length === 1) {
        if (listMenu.find((data) => data.id == sub.menusId) === undefined) listMenu.push(menu);
      }
    });
  });

  // console.log(listMenu);

  return listMenu;
};
