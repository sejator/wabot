# Whatsapp API by Sejator

## Requirement
- Mysql/Mariadb atau bisa install xampp, laragon, wampp server dll.
- Nodejs ```>= v18.19.0```
- Install ```npx```

## Instal Aplikasi
- Bikin database mysql dengan nama ```wabot```
- Rename file ```.env-sampel``` menjadi ```.env``` kemudian sesuaikan cofigurasinya
- Buka terminal/cmd kemudian masuk ke folder projek wabot ```cd ../path/wabot```
- Install library yang di butuhkan, jalankan peritah ```npm install```
- Kemudian jalankan perintah ```npx prisma migrate dev``` untuk migrasi/import database mysqlnya
- Import data dummynya ```npx prisma db seed```
- Jalankan aplikasi dengan perintah ```npm run win-dev``` atau ```npm run dev```

## Dokumentasi Api
[https://documenter.getpostman.com/view/20500330/2s946mbqoW](https://documenter.getpostman.com/view/20500330/2s946mbqoW)