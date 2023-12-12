/* eslint-disable no-unsafe-optional-chaining */
const QRCode = require("qrcode");
const pino = require("pino");
const { default: makeWASocket, DisconnectReason } = require("@whiskeysockets/baileys");
const moment = require("moment");
const axios = require("axios");
const config = require("../config/config");
const { strtolower, uuid } = require("../helpers/string");
const logger = require("pino")();
const { prisma } = require("../model");
const mysqlAuthState = require("../helpers/mysqlAuthState");
const processbtn = require("../helpers/processbtn");
const { formatWhatsappGroup, formatWhatsapp } = require("../helpers/formatter");
const startTime = moment(new Date()).millisecond();

let wabot = undefined;
let tujuan = undefined;

class WhatsAppInstance {
  key = "";
  authState;
  allowWebhook = undefined;
  webhook = undefined;
  socket = null;
  axiosInstance = null;

  /**
   * Config for makeWASocket
   */
  socketConfig = {
    defaultQueryTimeoutMs: undefined,
    printQRInTerminal: false,
    qrTimeout: config.qrTimout * 1000,
    logger: pino({
      level: config.log.level,
    }),
  };

  /**
   * Instance for WhatsAppInstance
   */
  instance = {
    key: "",
    chats: [],
    qr: "",
    messages: [],
    qrRetry: 0,
    customWebhook: "",
  };

  constructor(device, socket = null) {
    if (device == null || device == undefined) {
      logger.info("Parameter device not empty");
      throw new Error("Parameter device not empty");
    }

    this.key = device.key;
    this.socket = socket;
    this.instance.key = device.key;
    // ganti no tujuan untuk dikirim notifikasi oleh server WABOT
    tujuan = device.number;
    // untuk ganti nama device yang connect sesuai nama yang di daftarkan di WABOT
    config.browser.platform = device.name;

    // Jika webhook di aktifkan
    if (device.webhook && device.url !== null) {
      this.allowWebhook = device.webhook;
      this.webhook = device.url;
      this.instance.customWebhook = device.url;
      this.axiosInstance = axios.create({
        baseURL: device.url,
      });
    }
  }

  async init() {
    const { state, saveCreds } = await mysqlAuthState(this.key);
    this.authState = { state: state, saveCreds: saveCreds };
    this.socketConfig.auth = this.authState.state;
    this.socketConfig.browser = Object.values(config.browser);
    this.instance.sock = makeWASocket(this.socketConfig);
    this.setHandler();
    return this;
  }

  setHandler() {
    const sock = this.instance.sock;
    if (config.wabot === this.key) {
      wabot = sock;
    }
    // on credentials update save state
    sock?.ev.on("creds.update", this.authState.saveCreds);

    // on socket closed, opened, connecting
    sock?.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr, isNewLogin, isOnline } = update;

      if (connection === "connecting") return;

      if (connection === "close") {
        // reconnect if not logged out
        if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
          // mencoba koneksi ulang
          await this.init();
        } else {
          // proses hapus client whatsapp yang logout dari perangkat
          this.instance.online = false;
          const updateDevice = prisma.devices.update({
            where: {
              key: this.key,
            },
            data: {
              ready: false,
              updatedAt: moment().format(),
            },
          });

          const deleteAuthWa = prisma.waauts.deleteMany({
            where: {
              deviceKey: this.key,
            },
          });

          try {
            await prisma.$transaction([updateDevice, deleteAuthWa]);
            logger.info(`Device ${this.key} logout`);
          } catch (e) {
            logger.info(e);
          }

          this.#sendNotif(`❌ Opss...\n\nDevice *${this.key}* logout dari perangkat.`);
        }

        // jika webhook di aktifkan, terukan event data ke webhooknya
        if (this.allowWebhook && this.webhook !== null) {
          await this.SendWebhook("connection", { connection: connection }, this.key);
        }
      } else if (connection === "open") {
        // disini ada proses simpan chatingan whatsapp
        this.instance.online = true;
        // jika webhook di aktifkan, terukan event data ke webhooknya
        if (this.allowWebhook && this.webhook !== null) {
          await this.SendWebhook("connection", { connection: connection }, this.key);
        }
      }

      // whatsapp sudah ready
      if (isOnline) {
        console.log(`Whatsapp is ready! ${this.key}`);
        this.#sendNotif(`✅ Mantap...\n\nDevice *${this.key}* sudah terhubung.`);
      }

      // pertama kali login dan scan QR Code update status ready device
      if (isNewLogin && qr == undefined) {
        console.log(`New session ${this.key}`);
        if (this.socket) {
          this.socket.emit("loading", 0);
          this.socket.emit("message", "Proses login, silahkan tunggu!");

          setTimeout(() => {
            console.log(`Whatsapp is ready, after new login! ${this.key}`);
            this.socket.emit("ready", true);
            this.socket.emit("message", "Mantap... Whatsapp sudah siap!");

            this.#sendNotif(`✅ Mantap...\n\nDevice *${this.key}* sudah terhubung.`);
          }, 10000);
        }
        await prisma.devices.update({
          where: {
            key: this.key,
          },
          data: {
            ready: true,
            updatedAt: moment().format(),
          },
        });
      }

      if (qr) {
        QRCode.toDataURL(qr).then((url) => {
          this.instance.qr = url;
          this.instance.qrRetry++;
          if (this.instance.qrRetry >= config.instance.maxRetryQr) {
            // close WebSocket connection
            this.instance.sock.ws.close();
            // remove all events
            this.instance.sock.ev.removeAllListeners();
            this.instance.qr = " ";
            logger.info("socket connection terminated");
            if (this.socket) {
              this.socket.emit("destroy", true);
              this.socket.emit("message", "Waktu scan telah habis, silahkan ulang kembali!");
            }
          }
        });
      }
    });

    // sending presence
    sock?.ev.on("presence.update", async (json) => {
      // console.log(json);
      // jika webhook di aktifkan, terukan event data ke webhooknya
      if (this.allowWebhook && this.webhook !== null) {
        await this.SendWebhook("presence", json, this.key);
      }
    });

    // on receive all chats
    sock?.ev.on("chats.set", async ({ chats }) => {
      // console.log(chats);
      // this.instance.chats = [];
      // const recivedChats = chats.map((chat) => {
      //   return {
      //     ...chat,
      //     messages: [],
      //   };
      // });
      // this.instance.chats.push(...recivedChats);
    });

    // on recive new chat
    sock?.ev.on("chats.upsert", (newChat) => {
      //console.log('chats.upsert')
      // console.log(newChat);
      // const chats = newChat.map((chat) => {
      //   return {
      //     ...chat,
      //     messages: [],
      //   };
      // });
      // this.instance.chats.push(...chats);
    });

    // on chat change
    sock?.ev.on("chats.update", (changedChat) => {
      //console.log('chats.update')
      //console.log(changedChat)
      // changedChat.map((chat) => {
      //   const index = this.instance.chats.findIndex((pc) => pc.id === chat.id);
      //   const PrevChat = this.instance.chats[index];
      //   this.instance.chats[index] = {
      //     ...PrevChat,
      //     ...chat,
      //   };
      // });
    });

    // on chat delete
    sock?.ev.on("chats.delete", (deletedChats) => {
      //console.log('chats.delete')
      //console.log(deletedChats)
      // deletedChats.map((chat) => {
      //   const index = this.instance.chats.findIndex((c) => c.id === chat);
      //   this.instance.chats.splice(index, 1);
      // });
    });

    // on new mssage
    sock?.ev.on("messages.upsert", async (m) => {
      //console.log('messages.upsert')
      //console.log(m)
      if (m.type === "prepend") this.instance.messages.unshift(...m.messages);
      if (m.type !== "notify") return;

      // https://adiwajshing.github.io/Baileys/#reading-messages
      if (config.markMessagesRead) {
        const unreadMessages = m.messages.map((msg) => {
          return {
            remoteJid: msg.key.remoteJid,
            id: msg.key.id,
            participant: msg.key?.participant,
          };
        });
        await sock.readMessages(unreadMessages);
      }

      this.instance.messages.unshift(...m.messages);

      m.messages.map(async (msg) => {
        if (!msg.message) return;
        // pong replay koneksi device ke whatsapp
        this.#pongReplyKoneksi(sock, msg);
        const messageType = Object.keys(msg.message)[0];
        if (["protocolMessage", "senderKeyDistributionMessage"].includes(messageType)) return;

        const webhookData = {
          key: this.key,
          ...msg,
        };

        if (messageType === "conversation") {
          webhookData["text"] = m;
        }
        /*
        if (config.webhookBase64) {
          switch (messageType) {
            case "imageMessage":
              webhookData["msgContent"] = await downloadMessage(msg.message.imageMessage, "image");
              break;
            case "videoMessage":
              webhookData["msgContent"] = await downloadMessage(msg.message.videoMessage, "video");
              break;
            case "audioMessage":
              webhookData["msgContent"] = await downloadMessage(msg.message.audioMessage, "audio");
              break;
            default:
              webhookData["msgContent"] = "";
              break;
          }
        }
        */
        if (this.allowWebhook && this.webhook !== null) {
          await this.SendWebhook("message", webhookData, this.key);
        }
      });
    });

    sock?.ev.on("messages.update", async (messages) => {
      //console.log('messages.update')
      // console.log(messages);
      let newMessage = [];
      messages.map((message) => {
        if (newMessage.find((data) => data.id == message.key.id) === undefined) {
          newMessage.push({ id: message.key.id, status: message.update.status });
        }
      });

      try {
        this.#updelMessage(newMessage);
      } catch (error) {
        console.log(error);
      }
    });

    sock?.ev.on("groups.upsert", async (newChat) => {
      //console.log('groups.upsert')
      //console.log(newChat)
      this.createGroupByApp(newChat);
      if (this.allowWebhook && this.webhook !== null) {
        await this.SendWebhook("group_created", { data: newChat }, this.key);
      }
    });

    sock?.ev.on("groups.update", async (newChat) => {
      //console.log('groups.update')
      //console.log(newChat)
      this.updateGroupSubjectByApp(newChat);
      if (this.allowWebhook && this.webhook !== null) {
        await this.SendWebhook("group_updated", { data: newChat }, this.key);
      }
    });

    sock?.ev.on("group-participants.update", async (newChat) => {
      //console.log('group-participants.update')
      //console.log(newChat)
      this.updateGroupParticipantsByApp(newChat);
      if (this.allowWebhook && this.webhook !== null) {
        await this.SendWebhook("group_participants_updated", { data: newChat }, this.key);
      }
    });
  }
  // End event Whatsapp

  /**
   * Fungsi kirim notifikasi untuk client baru
   * @param {*} message
   */
  async #sendNotif(message) {
    if (wabot == undefined) return false;
    if (config.wabot == this.key) return false;

    try {
      const [verify] = await wabot.onWhatsApp(tujuan);
      setTimeout(async () => {
        await wabot.sendMessage(verify.jid, { text: `${message}\n\nTerima Kasih\n*~ WABOT ~*` });
      }, 1000);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Fungsi untuk kirim notif ke webhook jika diaktifkan
   *
   * @param {*} type
   * @param {*} body
   * @param {*} key
   * @returns
   */
  async SendWebhook(type, body, key) {
    if (!this.allowWebhook) return;
    this.axiosInstance
      .post("", {
        type,
        body,
        key: key,
      })
      .catch((e) => {
        console.log(e);
      });
  }

  /**
   * Fungsi untuk update atau delete pesan
   *
   * @param {*} message
   * @returns
   */
  async #updelMessage(messages) {
    // console.log(messages);
    setTimeout(() => {
      messages.map(async (val, i) => {
        return await prisma.$transaction(async (tx) => {
          const find = await tx.messages.findFirst({
            where: {
              messageId: val.id,
            },
            select: {
              secure: true,
            },
          });
          if (find === null) return;
          let updel;
          if (find.secure) {
            updel = prisma.messages.delete({
              where: {
                messageId: val.id,
              },
            });
          } else {
            updel = prisma.messages.update({
              where: {
                messageId: val.id,
              },
              data: {
                read: val.status,
                updatedAt: moment().format(),
              },
            });
          }
          return updel;
        });
      });
    }, 3000);
  }

  /**
   * Fungsi untuk tes koneksi whtasapp terhubung atau tidak
   *
   * @param {Instance} sock Instance dari client whatsapp yang aktif
   * @param {Object} msg Pesan dari whatsapp yang masuk
   */
  async #pongReplyKoneksi(sock, msg) {
    // console.log(msg);
    let keyword;
    if (msg.message.conversation) {
      // Whatsapp biasa
      keyword = msg.message.conversation;
    } else if (msg.message.extendedTextMessage) {
      // whatsapp bisnis
      keyword = msg.message.extendedTextMessage.text;
    } else if (msg.message.buttonsResponseMessage) {
      keyword = msg.message.buttonsResponseMessage.selectedDisplayText;
    } else if (msg.message.listResponseMessage) {
      keyword = msg.message.listResponseMessage.title;
    }

    if (strtolower(keyword) === "!ping") {
      const waktu = moment().format("DD-MM-YYYY HH:mm:ss");
      const endTime = moment(new Date()).millisecond();
      const dueTime = endTime - startTime;
      const latency = dueTime <= 0 ? 0 : dueTime;
      const text = `🏓 Pong...\nWaktu server : ${waktu} WIB\n\n\`\`\`${latency}ms\`\`\``;

      await sock.sendMessage(msg.key.remoteJid, { text: text }, { quoted: msg });
      await sock.readMessages([msg.key]);
    } else {
      // auto reply dari database
      this.#autoReplyMessage(sock, msg, keyword);
    }
  }

  // jawaban oto,atis bot
  async #autoReplyMessage(sock, msg, keyword) {
    // console.log(msg);
    // console.log(msg.message.conversation);
    try {
      const data = await prisma.autoreply.findFirst({
        where: {
          deviceKey: this.key,
          keyword: keyword,
        },
        include: {
          buttonreply: true,
        },
      });

      if (data == null) return false; // keyword tidak ditemukan

      let result;
      if (data.type == "TEXT") {
        result = await sock.sendMessage(msg.key.remoteJid, { text: data.message }, { quoted: msg });
        await sock.readMessages([msg.key]);
      } else {
        let templateMessage;

        if (data.type === "BUTTON") {
          const buttons = [];
          data.buttonreply.map((val, i) => {
            buttons.push({
              buttonId: `id${val.id}`,
              buttonText: { displayText: val.name },
              type: true,
            });
          });

          templateMessage = {
            text: data.message,
            footer: data.footer ?? "",
            buttons: buttons,
            viewOnce: true,
          };
        } else {
          const sections = [
            {
              title: data.title,
              rows: [],
            },
          ];

          data.buttonreply.map((val, i) => {
            sections[0].rows.push({
              title: val.name,
              rowId: `option${val.id}`,
            });
          });

          templateMessage = {
            text: data.message,
            footer: data.footer,
            title: data.title,
            buttonText: data.title,
            sections,
            viewOnce: true,
          };
        }

        result = await sock.sendMessage(msg.key.remoteJid, templateMessage);
        await sock.readMessages([msg.key]);
        // console.log(result);
      }
      // await sock.readMessages([msg.key]);
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   *
   * @param {String} id No atau ID group whatsapp
   * @param {Boolean} isGroup Verifikasi no whatsapp atau group default (false)
   * @returns
   */
  async verifyId(id, isGroup) {
    if (isGroup) {
      return formatWhatsappGroup(id);
    } else {
      return formatWhatsapp(id);
    }
  }
  // async verifyId(id, isGroup) {
  //   const [result] = await this.instance.sock?.onWhatsApp(id);
  //   if (isGroup && result == undefined) {
  //     return id.includes("@g.us") ? id : `${id}@g.us`;
  //   }

  //   if (result === undefined) throw new Error("Akun tidak ditemukan!");
  //   if (!result.exists) throw new Error("Akun tidak ditemukan!");

  //   return result.jid;
  // }

  /**
   * BOT join ke group
   *
   * @param {*} newChat
   */
  async createGroupByApp(newChat) {
    // console.log(newChat);
    try {
      const group = await prisma.groups.findFirst({
        where: {
          groupId: newChat[0].id,
        },
        select: {
          groupId: true,
          groupAnggota: true,
        },
      });

      const groupAnggota = newChat[0].participants.map((chat) => chat.id);
      if (group == null) {
        // BOT baru pertama kali di masukkan ke group
        await prisma.groups.create({
          data: {
            uuid: uuid.v4(),
            deviceKey: this.key,
            groupId: newChat[0].id,
            groupName: newChat[0].subject,
            groupAuthor: newChat[0].subjectOwner.replace(/\D/g, ""),
            groupDeskripsi: newChat[0].subject,
            groupAnggota: JSON.stringify(groupAnggota),
            total: newChat[0].participants.length,
            createdAt: moment().format(),
            updatedAt: moment().format(),
          },
        });
      } else {
        // BOT di masukan ke group lagi setelah sebelumnya di keluarkan
        await prisma.groups.update({
          where: {
            groupId: newChat[0].id,
          },
          data: {
            groupAnggota: JSON.stringify(groupAnggota),
            total: newChat[0].participants.length,
            updatedAt: moment().format(),
          },
        });
      }
    } catch (e) {
      console.log(e);
      logger.error("Error updating document failed");
    }
  }

  /**
   * Fungsi untuk handel event update subject group
   *
   * @param {Object} newChat
   */
  async updateGroupSubjectByApp(newChat) {
    // console.log(newChat);
    try {
      if (newChat[0] && newChat[0].subject) {
        await prisma.groups.update({
          where: {
            groupId: newChat[0].id,
          },
          data: {
            groupName: newChat[0].subject,
            groupDeskripsi: newChat[0].subject,
            updatedAt: moment().format(),
          },
        });
      }
    } catch (e) {
      logger.error(e);
      logger.error("Error updating document failed");
    }
  }

  /**
   * Fungsi untuk update data ketika tambah dan hapus peserta dari group
   *
   * @param {Object} object Data dari respon whatsapp
   */
  async updateGroupParticipantsByApp(object) {
    try {
      const particip = object.participants[0];
      const group = await prisma.groups.findFirst({
        where: {
          groupId: object.id,
        },
        select: {
          groupAnggota: true,
        },
      });

      if (group === null) return null;

      let participants = JSON.parse(group.groupAnggota);
      const index = participants.indexOf(particip);
      if (index > -1 && object.action == "remove") {
        participants.splice(index, 1);
      } else {
        if (object.action == "add") {
          participants.push(particip);
        }
      }

      await prisma.groups.update({
        where: {
          groupId: object.id,
        },
        data: {
          groupAnggota: JSON.stringify(participants),
          total: participants.length,
          updatedAt: moment().format(),
        },
      });
      // console.log(participants);
    } catch (e) {
      console.log(e);
    }
  }

  // ================================
  // API instance from Whatsapp Baileys
  // ================================

  /**
   * Fungsi API untuk kirim pesan text
   *
   * @param {String} to No atau ID group whatsapp tujuan
   * @param {String} message Isi pesan yang akan dikirim
   * @param {Boolean} isGroup Jika true maka verifikasi no whatsapp di abaikan defaul (false)
   *
   * @returns
   */
  async sendText(to, message, isGroup) {
    // await this.verifyId(this.getWhatsAppId(to));
    const number = await this.verifyId(to, isGroup);
    // const data = await this.instance.sock?.sendMessage(this.getWhatsAppId(number), { text: message });
    const data = await this.instance.sock?.sendMessage(number, { text: message });
    return data;
  }

  /**
   * Fungsi API untuk kirim pesan gambar
   *
   * @param {*} to No atau ID group whatsapp tujuan
   * @param {*} isGroup Jika true maka verifikasi no whatsapp di abaikan defaul (false)
   * @param {*} image File gambar yang akan dikirim
   * @param {*} caption Isi caption dari gambar
   * @returns
   */
  async sendImage(to, isGroup, image, caption) {
    const number = await this.verifyId(to, isGroup);
    const data = await this.instance.sock?.sendMessage(number, {
      image: image,
      caption: caption,
    });
    return data;
  }

  /**
   * Fungsi API untuk kirim pesan video atau Gif
   *
   * @param {*} to No atau ID group whatsapp tujuan
   * @param {*} isGroup Jika true maka verifikasi no whatsapp di abaikan defaul (false)
   * @param {*} video File video yang akan dikirim
   * @param {*} caption Isi caption dari video
   * @returns
   */
  async sendVideo(to, isGroup, video, caption) {
    const number = await this.verifyId(to, isGroup);
    const data = await this.instance.sock?.sendMessage(number, {
      video: video,
      caption: caption,
      // gifPlayback: true, // jika diaktifkan akan jadi GIF
    });
    return data;
  }

  /**
   * Fungsi API untuk kirim pesan file dokument
   *
   * @param {*} to No atau ID group whatsapp tujuan
   * @param {*} isGroup Jika true maka verifikasi no whatsapp di abaikan defaul (false)
   * @param {*} document File document yang akan dikirim { file: file, name: name, mimetype: mimetype }
   * @param {*} caption Isi caption dari document
   * @returns
   */
  async sendDocument(to, isGroup, document, caption) {
    const number = await this.verifyId(to, isGroup);
    const data = await this.instance.sock?.sendMessage(number, {
      document: document.file,
      fileName: document.name,
      mimetype: document.mimetype,
      caption: caption,
    });

    return data;
  }

  async sendButtonMessage(to, data) {
    await this.verifyId(this.getWhatsAppId(to));
    const result = await this.instance.sock?.sendMessage(this.getWhatsAppId(to), {
      templateButtons: processButton(data.buttons),
      text: data.text ?? "",
      footer: data.footerText ?? "",
      viewOnce: true,
    });
    return result;
  }

  async sendListMessage(to, data) {
    await this.verifyId(this.getWhatsAppId(to));
    const result = await this.instance.sock?.sendMessage(this.getWhatsAppId(to), {
      text: data.text,
      sections: data.sections,
      buttonText: data.buttonText,
      footer: data.description,
      title: data.title,
      viewOnce: true,
    });
    return result;
  }

  async sendMediaButtonMessage(to, data) {
    await this.verifyId(this.getWhatsAppId(to));

    const result = await this.instance.sock?.sendMessage(this.getWhatsAppId(to), {
      [data.mediaType]: {
        url: data.image,
      },
      footer: data.footerText ?? "",
      caption: data.text,
      templateButtons: processButton(data.buttons),
      mimetype: data.mimeType,
      viewOnce: true,
    });
    return result;
  }

  /**
   * Fungsi API untuk proses logout dari whatsapp
   *
   * @param {*} key Kode Unique device
   * @returns
   */
  async deleteInstance(key) {
    try {
      await this.instance?.sock?.logout();
      return true;
    } catch (e) {
      logger.error(e);
      logger.error("Error updating document failed");
      return e;
    }
  }

  /**
   * Fungsi API untuk detail device yang login
   *
   * @param {*} key
   * @returns
   */
  async getInstanceDetail(key) {
    let user = {};
    if (this.instance?.online) {
      const u = this.instance.sock?.user;
      user = {
        nomor: u.id.split(":")[0],
        nama: u.name,
      };
    }
    return {
      device: key,
      koneksi: this.instance?.online,
      webhook: this.allowWebhook,
      url: this.instance.customWebhook,
      user: user,
    };
  }

  /**
   * Fungsi API untuk mengambil list group dari instance whatsapp
   *
   * @returns Object list group
   */
  async groupFetchAllParticipating() {
    try {
      const result = await this.instance.sock?.groupFetchAllParticipating();
      return result;
    } catch (e) {
      logger.error("Error group fetch all participating failed");
    }
  }

  /**
   * Fungsi API untuk membaca pesan
   *
   * @param {*} msgObj
   * @returns
   */
  async readMessage(msgObj) {
    try {
      const key = {
        remoteJid: msgObj.remoteJid,
        id: msgObj.id,
        participant: msgObj?.participant, // required when reading a msg from group
      };
      const res = await this.instance.sock?.readMessages([key]);
      return res;
    } catch (e) {
      logger.error("Error read message failed");
    }
  }

  /**
   * Fungsi API untuk menamabhkan reaction
   * @param {*} id
   * @param {*} key
   * @param {*} emoji
   * @returns
   */
  async reactMessage(id, key, emoji) {
    try {
      const reactionMessage = {
        react: {
          text: emoji, // use an empty string to remove the reaction
          key: key,
        },
      };
      const res = await this.instance.sock?.sendMessage(this.getWhatsAppId(id), reactionMessage);
      return res;
    } catch (e) {
      logger.error("Error react message failed");
    }
  }
}

exports.WhatsAppInstance = WhatsAppInstance;
