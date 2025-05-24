const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        avatar: {
            type: String,
            default: "[https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg](https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg)",
        },
        onlineStatus: { type: String, default: 'offline' }, // 'online', 'offline', 'away'
        lastSeen: { type: Date }
    },
    { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// userSchema.pre('save', async function (next) {
//     if (!this.isModified('password')) {
//         next();
//     }
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
// });

const User = mongoose.model('User', userSchema);
module.exports = User;