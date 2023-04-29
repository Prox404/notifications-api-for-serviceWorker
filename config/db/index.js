const mongoose = require('mongoose');


async function connect() {
    try {
        console.log(process.env.MONGODB_URI);
        await mongoose.set("strictQuery", false);
        await mongoose.connect(process.env.MONGODB_URI,{
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connect successfully!!!');
    } catch (error) {
        console.log('Connect failure!!!');
        console.log(error);
    }
}

module.exports = { connect };