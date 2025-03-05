import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"], // Custom error message
        },
        missions : [{
            type : Schema.Types.ObjectId,
            ref : "Mission",
        }],
        level : {
            type : Number,
            required : true,
            default : 0,
        },
        totalPoints : {
            type : Number,
            required : true,
            default : 0,
        },
        crntPoints : {
            type : Number,
            required : true,
            default : 0,
        },
        coins : {
            type : Number,
            required : true,
            default : 0,
        },
        refreshToken : {
            type:String,
        },
        JoinedeCommunities:[{
            type:Schema.Types.ObjectId,
            ref:"Community",
        }]
    },
    { timestamps: true } // Ensure timestamps are inside the Schema options
);

// Hash the password before saving
// userSchema.pre("save", async function (next) {
//     if (this.isModified("password")) {
//         this.password = await bcrypt.hash(this.password, 10);
//     }
//     next();
// });

// Compare entered password with hashed password
userSchema.methods.isPasswordCorrect = async function (password) {
    return password === this.password;
};

// Generate Access Token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            // fullName: this.fullName,
            email: this.email,
            username: this.username,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1h", // Default expiry
        }
    );
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d", // Default expiry
        }
    );
};

const User = model("User", userSchema);
export default User;
