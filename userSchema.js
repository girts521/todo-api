const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
    },
    password: {
        type: String
    },
    todo: {
        type: Array
    },
    complated: {
        type: Array
    },

    projects: {
        type: Array
    }

})

module.exports = mongoose.model('User', UserSchema)