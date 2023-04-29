const express = require('express');
const app = express();
const cors = require('cors');
const db = require('./config/db');
const webpush = require('web-push');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
db.connect();

const corsOptions = {
    origin: "*",
    credentials: true, // Access-control-allow-credentials:true
    optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

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
    'http://192.168.1.6:5500/',
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

// const notificationSchema = new mongoose.Schema({
//     title: String,
//     content: String,
//     time: Date
// });

// const Notification = mongoose.model('Notification', notificationSchema);

// io.on('connection', (socket) => {
//     console.log('a user connected');
// });

app.post('/api/subscribe', (req, res) => {
    console.log("body", req.body.subscription);
    const { endpoint, keys } = req.body.subscription;

    const newSubscribe = new Subscribe({
        endpoint,
        expirationTime: null,
        keys: {
            p256dh: keys.p256dh,
            auth: keys.auth
        }
    });

    if (Subscribe.findOne({ endpoint: endpoint })) {
        res.status(200).json({ message: 'User has been subscribed!' });
    } else {

        newSubscribe.save().catch(err => {
            res.status(500).json({ message: 'Subscribe failure' });
            return;
        });

        res.status(200).json({ message: 'Subscribe successfully' });

    }
});

app.post('/api/send-notification', (req, res) => {
    const { title, content, time } = req.body;
    console.log(req.body);

    // Lưu thông tin vào cơ sở dữ liệu
    // const newNotification = new Notification({
    //     title,
    //     content,
    //     time
    // });

    // newNotification.save().then(() => {
    //     res.status(200).json({ message: 'Notification sent successfully' });
    // }).catch(err => {
    //     res.status(500).json({ message: 'Notification sent failure' });
    //     // console.log(err)
    //     return;
    // });
    try {

        // Gửi thông báo tới các clients khác
        let currentTime = new Date().getTime();
        let timeSend = new Date(time).getTime();
        console.log("Time: ", currentTime, timeSend);
        let delay = timeSend - currentTime;

        console.log(delay);


        Subscribe.find().then(subscribes => {
            if (!subscribes) {
                res.status(500).json({ message: 'No subscribers found' })
                return;
            }
            subscribes.forEach(subscribe => {
                const pushSubscription = {
                    endpoint: subscribe.endpoint,
                    expirationTime: subscribe.expirationTime,
                    keys: {
                        p256dh: subscribe.keys.p256dh,
                        auth: subscribe.keys.auth
                    }
                };

                const payload = JSON.stringify({
                    title: title,
                    message: content,
                    delay: delay > 0 ? delay : 0
                });

                console.log('payload: ', payload);

                webpush.sendNotification(pushSubscription, payload).catch(err => {
                    console.log(err);
                });
            });
        }).catch(err => {
            console.log(err);
        });
        setTimeout(() => {
            res.status(200).json({ message: 'Notification sent successfully' })
        }, 500);
    } catch {
        res.status(500).json({ message: 'Notification sent failure' });
    }


});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});