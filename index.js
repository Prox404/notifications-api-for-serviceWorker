const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const cors = require('cors');
const db = require('./config/db');
const webpush = require('web-push');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
db.connect();

app.use(cors());

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.get('/socket.io', function (req, res) {
    res.send('Connected !');
});

let VAPIDKeys = {
    publicKey: 'BLl_utTXOFdsD7sXCuVv9GMEozNxPoPPpNZpTW64m9E47pRAhmbtLv4Lv6JB9FSQQ2vbAVvf4Dc8Rls4GWyPp3E',
    privateKey: 'Q3tW3_NdHYPLWwln74lY2d6CIsU_gqxrbtjxdCh-FTQ'
}

webpush.setVapidDetails(
    'http://192.168.1.2:5500/',
    VAPIDKeys.publicKey,
    VAPIDKeys.privateKey
);
// console.log(generateVAPIDKeys);

const subscribeSchema = new mongoose.Schema({
    endpoint: String,
    expirationTime: String || null,
    keys: {
        p256dh: String,
        auth: String,
    }
});

const Subscribe = mongoose.model('Subscribe', subscribeSchema);

const notificationSchema = new mongoose.Schema({
    title: String,
    content: String,
    time: Date
});

const Notification = mongoose.model('Notification', notificationSchema);

app.post('/api/subscribe', (req, res) => {
    console.log("body", req.body.subscription);
    const { endpoint, keys } = req.body.subscription;

    const newSubscribe = new Subscribe({
        endpoint,
        expirationTime : null,
        keys: {
            p256dh: keys.p256dh,
            auth: keys.auth
        }
    });

    newSubscribe.save().then(() => {
        res.status(200).json({ message: 'Subscribe successfully' });
    }).catch(err => {
        res.status(500).json({ message: 'Subscribe failure' });
    });
});

app.post('/api/notification', (req, res) => {
    const { title, content, time } = req.body;
  
    // Lưu thông tin vào cơ sở dữ liệu
    const newNotification = new Notification({
        title,
        content,
        time
    });

    newNotification.save().then(() => {
        res.status(200).json({ message: 'Notification sent successfully' });
    }).catch(err => {
        res.status(500).json({ message: 'Notification sent failure' });
    });
  
    // Gửi thông báo tới các clients khác
    io.emit('new-notification', { title, content, time });
  
    res.status(200).json({ message: 'Notification sent successfully' });
  });

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});