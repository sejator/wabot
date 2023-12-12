const { proto } = require("@whiskeysockets/baileys/WAProto");
const { Curve, signedKeyPair } = require("@whiskeysockets/baileys/lib/Utils/crypto");
const { generateRegistrationId } = require("@whiskeysockets/baileys/lib/Utils/generics");
const { randomBytes } = require("crypto");
const moment = require("moment");
const { prisma } = require("../model");

const initAuthCreds = () => {
  const identityKey = Curve.generateKeyPair();
  return {
    noiseKey: Curve.generateKeyPair(),
    signedIdentityKey: identityKey,
    signedPreKey: signedKeyPair(identityKey, 1),
    registrationId: generateRegistrationId(),
    advSecretKey: randomBytes(32).toString("base64"),
    processedHistoryMessages: [],
    nextPreKeyId: 1,
    firstUnuploadedPreKeyId: 1,
    accountSettings: {
      unarchiveChats: false,
    },
  };
};

const BufferJSON = {
  replacer: (k, value) => {
    if (Buffer.isBuffer(value) || value instanceof Uint8Array || value?.type === "Buffer") {
      return {
        type: "Buffer",
        data: Buffer.from(value?.data || value).toString("base64"),
      };
    }

    return value;
  },

  reviver: (_, value) => {
    if (typeof value === "object" && !!value && (value.buffer === true || value.type === "Buffer")) {
      const val = value.data || value.value;
      return typeof val === "string" ? Buffer.from(val, "base64") : Buffer.from(val || []);
    }

    return value;
  },
};

module.exports = useMysqlDBAuthState = async (deviceKey) => {
  /**
   *
   * @param {*} key
   * @param {*} type
   * @param {*} data
   * @returns
   */
  const writeData = async (key, type, data) => {
    // console.log("TAMBAH DATA", type, data);
    const find = await prisma.waauts.findFirst({
      where: {
        deviceKey: key,
        type: type,
      },
    });

    let collection;
    if (find == null) {
      collection = await prisma.waauts.create({
        data: {
          deviceKey: key,
          type: type,
          credentials: JSON.stringify(data, BufferJSON.replacer),
          createdAt: moment().format(),
          updatedAt: moment().format(),
        },
      });
      // console.log("TAMBAH COLLETION", collection);
    } else {
      collection = await prisma.waauts.updateMany({
        where: {
          deviceKey: key,
          type: type,
        },
        data: {
          credentials: JSON.stringify(data, BufferJSON.replacer),
          updatedAt: moment().format(),
        },
      });
      // console.log("UPDATE COLLETION", collection);
    }

    return JSON.parse(JSON.stringify(data, BufferJSON.replacer));
  };

  const readData = async (key, type) => {
    try {
      const data = await prisma.waauts.findFirst({
        where: {
          deviceKey: key,
          type: type,
        },
        select: {
          credentials: true,
        },
      });

      if (data == null) return;

      return JSON.parse(data.credentials, BufferJSON.reviver);
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  const removeData = async (key, type) => {
    try {
      // console.log("DELETE", key, type);
      await prisma.waauts.deleteMany({
        where: {
          deviceKey: key,
          type: type,
        },
      });
    } catch (_a) {}
  };

  const creds = (await readData(deviceKey, "creds")) || (0, initAuthCreds)();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(deviceKey, `${type}-${id}`);
              if (type === "app-state-sync-key") {
                value = proto.Message.AppStateSyncKeyData.fromObject(data);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category of Object.keys(data)) {
            for (const id of Object.keys(data[category])) {
              const value = data[category][id];
              const tipe = `${category}-${id}`;
              // console.log("SET", tipe, value);
              tasks.push(value ? await writeData(deviceKey, tipe, value) : await removeData(deviceKey, tipe));
            }
          }
          // console.log(tasks);
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: async () => {
      return await writeData(deviceKey, "creds", creds);
    },
  };
};
