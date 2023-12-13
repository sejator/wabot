# Whatsapp API by Sejator

## Requirement
- Mysql/Mariadb atau bisa install xampp, laragon, wampp server dll.
- Nodejs ```>= v18.19.0```
- Install ```npx```

## Instal Aplikasi
- Bikin database mysql dengan nama ```wabot```
- Rename file ```.env-sampel``` menjadi ```.env``` kemudian sesuaikan konfigurasinya
- Buka terminal/cmd kemudian masuk ke folder projek wabot ```cd ../path/wabot```
- Install library yang di butuhkan, jalankan peritah ```npm install```
- Kemudian jalankan perintah ```npx prisma migrate dev``` untuk migrasi/import database mysqlnya
- Import data dummynya ```npx prisma db seed```
- Jalankan aplikasi dengan perintah ```npm run win-dev``` atau ```npm run dev```

## Dokumentasi Api
[https://documenter.getpostman.com/view/20500330/2s946mbqoW](https://documenter.getpostman.com/view/20500330/2s946mbqoW)

## VPS (Opsional jika running menggunakan nvm)
- Bikin service untuk menjalankan wabot `sudo nano/etc/systemd/system/wabot.service` isi dengan script ini dan sesuaikan lokasi projeknya.
```
[Unit]
Description=Wabot Restfult API

[Service]
EnvironmentFile=-/etc/default/wabot
ExecStart=/path/to/wabot/start.sh
WorkingDirectory=/path/to/wabot
LimitNOFILE=4096
IgnoreSIGPIPE=false
KillMode=process
User=$USER

[Install]
WantedBy=multi-user.target
```
- Ubah lokasi path di file `start.sh`
- Pastikan file start.sh dapat dieksekusi.
```
chmod +x /path/to/wabot/start.sh
```
- Aktifkan servicenya
```
sudo systemctl start wabot
```
```
sudo systemctl enable wabot
```