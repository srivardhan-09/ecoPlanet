import mongoose, { Schema, model } from "mongoose";

const communitySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        theme: {
            type: String,
            required: true,
            trim: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        description : {
            type: String,
            required: true,
            trim: true,
        },
        members:[{
            type: Schema.Types.ObjectId,
            ref: "User",
            
        }],
        posts:[{
            type:Schema.Types.ObjectId,
        }]
    },
    { timestamps: true }
);

export default model("Community", communitySchema);
