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
        image: {
            type: String,
            required: false,
        },
        likes: {
            type: Number,
            default : 0,

        },
        
    },
    { timestamps: true }
);

export default model("Post", postSchema);
