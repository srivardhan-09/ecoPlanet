import mongoose, { Schema, model } from "mongoose";

const missionSchema = new Schema(
    {
        // userId: {
        //     type: Schema.Types.ObjectId,
        //     ref: "User",
        //     required: true,
        // },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description : {
            type: String,
            required: true,
            trim: true,
        },
        // status: {
        //     type: Boolean,
        //     default: false,
        // },
        points: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        coins: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        date : {
            type :Date,
            required :true
        },
        completedPeople:[{
            type :Schema.Types.ObjectId,
            ref: "User",
            required: true

        }]
    },
    { timestamps: true }
);

// ✅ Correct way to export for ES modules
export default model("Mission", missionSchema);
