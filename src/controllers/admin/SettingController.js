const { strtolower, ucword } = require("../../helpers/string");
const { prisma } = require("../../model");

class SettingController {
  static async index(req, res, next) {
    res.render("admin/setting/index", { title: "Setting" });
  }

  static async menu(req, res, next) {
    const menus = await prisma.menus.findMany({
      orderBy: {
        urut: "asc",
      },
    });
    // console.log(menus);
    res.render("admin/setting/menu", { title: "Menu", menus: menus });
  }

  static async saveMenu(req, res, next) {
    const { main, icon, link, urut } = req.body;
    const menu = await prisma.menus.create({
      data: {
        main: ucword(main),
        icon: strtolower(icon),
        link: strtolower(link),
        urut: Number(urut),
      },
    });

    res.json(menu);
  }

  static async updateMenu(req, res, next) {
    const { id_main, edit_main, edit_icon, edit_link, edit_urut } = req.body;
    const menu = await prisma.menus.update({
      where: {
        id: Number(id_main),
      },
      data: {
        main: ucword(edit_main),
        icon: strtolower(edit_icon),
        link: strtolower(edit_link),
        urut: Number(edit_urut),
      },
    });

    res.json(menu);
  }

  static async submenu(req, res, next) {
    const id_menu = req.params.id;
    const submenus = await prisma.submenus.findMany({
      where: {
        menusId: Number(id_menu),
      },
      include: {
        menus: {
          select: {
            main: true,
          },
        },
      },
    });

    // console.log(submenus);
    res.render("admin/setting/submenu", { submenus: submenus });
  }

  static async saveSubmenu(req, res, next) {
    const { main_id, submenu, link_submenu, urut_submenu } = req.body;
    const sub = await prisma.submenus.create({
      data: {
        sub: ucword(submenu),
        link: strtolower(link_submenu),
        urut: Number(urut_submenu),
        menusId: Number(main_id),
      },
    });

    res.json(sub);
  }

  static async updateSubmenu(req, res, next) {
    const { edit_submenu, edit_id_main, edit_link_submenu, edit_urut_submenu, id_sub } = req.body;
    const sub = await prisma.submenus.update({
      where: {
        id: Number(id_sub),
      },
      data: {
        sub: ucword(edit_submenu),
        link: strtolower(edit_link_submenu),
        urut: Number(edit_urut_submenu),
        menusId: Number(edit_id_main),
      },
    });

    res.json(sub);
  }

  static async searchMenu(req, res, next) {
    let search = req.query.search;
    let page = req.query.page ? Number(req.query.page) : 0;
    let start = page * 10;
    let limit = 10;

    let menus;
    if (search) {
      menus = await prisma.menus.findMany({
        where: {
          main: {
            search: search,
          },
        },
        take: limit,
        skip: start,
      });
    } else {
      // all menu
      menus = await prisma.menus.findMany({
        take: limit,
        skip: start,
      });
    }

    let result = {
      results: [],
      pagination: { more: true },
    };

    if (menus.length < 10) {
      result.pagination.more = false;
    }

    menus.forEach((val, i) => {
      let data = {
        id: val.id,
        text: val.main,
      };

      result.results.push(data);
    });

    res.json(result);
    //     $page   = $this->input->get('page');
    //     $start  = ($page * 10);
    //     $limit  = 10;

    //     $mainMenu = $this->setting->all_menu($start, $limit, $search);

    //     $result = array(
    //         'results' => array(),
    //         'pagination' => array('more' => true)
    //     );

    //     if (count($mainMenu) < 10) {
    //         $result['pagination']['more'] = false;
    //     }
    //     foreach ($mainMenu as $row) {
    //         $data = array(
    //             'id'       => $row->id,
    //             'text'     => $row->main,
    //         );
    //         array_push($result['results'], $data);
    //     }
    //     return responseJson($result);

    // const menus = await prisma.menus.findMany();
  }

  static async usermenu(req, res, next) {
    const roles = await prisma.roles.findMany({
      include: {
        _count: {
          select: {
            usermenus: true,
          },
        },
      },
    });

    // console.log(roles);
    res.render("admin/setting/usermenu", { title: "Usermenu", roles: roles });
  }

  static async listUsermenu(req, res, next) {
    const roleId = req.params.roleId;
    const usermenu = await prisma.usermenus.findMany({
      where: {
        rolesId: Number(roleId),
      },
      include: {
        submenus: true,
      },
    });

    const submenus = await prisma.submenus.findMany({
      include: {
        usermenus: {
          where: {
            rolesId: Number(roleId),
          },
        },
      },
    });
    // console.log(usermenu);
    // console.log(submenus[0].usermenus.length);
    res.render("admin/setting/list-usermenu", { usermenu: usermenu, submenus: submenus });
  }

  static async saveUsermenu(req, res, next) {
    const { sub_id, role_id } = req.body;
    let upsert;
    try {
      upsert = await prisma.usermenus.findFirstOrThrow({
        where: {
          submenusId: Number(sub_id),
          rolesId: Number(role_id),
        },
      });
    } catch (error) {
      upsert = await prisma.usermenus.create({
        data: {
          submenusId: Number(sub_id),
          rolesId: Number(role_id),
        },
      });
    }
    res.json(upsert);
  }

  static async deleteUsermenu(req, res, next) {
    const id = req.params.id;
    const del = await prisma.usermenus.delete({
      where: {
        id: Number(id),
      },
    });
    res.json(del);
  }
}

module.exports = SettingController;
