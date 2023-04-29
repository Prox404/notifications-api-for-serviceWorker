const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function connect() {
    try {
        console.log(process.env.MONGODB_URL);
        await mongoose.set("strictQuery", false);
        await mongoose.connect(process.env.MONGODB_URL,{
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connect successfully!!!');
    } catch (error) {
        console.log('Connect failure!!!');
    }
}

module.exports = { connect };