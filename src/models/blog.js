import mongoose, { Schema, model } from "mongoose";

const blogSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User", // References the User model
            required: true,
        },
        title : {
            type : String,
            required : true,
        },
        
        content: {
            type: String,
            required: true,
            trim: true,
        },
        image: {
            type: String, // Cloudinary image URL
            required: true,
        },
        likes: {
            type: Number,
            default: 0,
            min: 0, 
        },
        views: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    { timestamps: true }
);

const Blog = model("Blog", blogSchema);
export default Blog;
