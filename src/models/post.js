import mongoose, { Schema, model } from "mongoose";

const postSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        images: [{
            type: String,
            required: false,
        }],
        likes: [{
            type: Schema.Types.ObjectId,
            ref: "User",
        }],
    },
    { timestamps: true }
);

export default model("Post", postSchema);
