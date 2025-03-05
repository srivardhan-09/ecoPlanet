import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { asyncHandler } from "./utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import Blog from "./models/Blog.js";
// import User from "./models/User.js";
import {verifyJWT} from "./routes/auth.js";
import User from "./models/usermodel.js";
import Mission from "./models/missions.js";
import {uploadOnCloudinary} from "./utils/cloudinary.js";
import {upload} from "./utils/multer.js"
import Community from "./models/community.js";
import Post from "./models/post.js"

const app = express();
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

const allowedOrigins = [process.env.CORS_ORIGIN, "http://localhost:5173", "http://localhost:8000"];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// ✅ Signup (with JWT token generation)
app.post("/signup", asyncHandler(async (req, res) => {
    console.log(req.body);

    const { username, email, password } = req.body;

    if ([username, password, email].some(field => field?.trim() === "")) {
        return res.status(400).json({ error: "Please enter all fields" });
    }

    const existedUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existedUser) return res.status(400).json({ error: "Username or Email already exists" });

    const user = await User.create({
        username: username.toLowerCase(),
        password,
        email,
    });

    if (!user) return res.status(500).json({ error: "Error saving user to database" });


    res.status(201).json({
        message: "Signup successful",
        user: { id: user._id, username: user.username, email: user.email }
    });
}));

// ✅ Signin (Token Already Implemented)
app.post("/signin", asyncHandler(async (req,res) => {
    
    const {email, password} = req.body;

    if(!email ){
        res.status(400).send("Username or Email is Required")
        // throw new ApiError(400,"Username or Email is Required");
    }
    if(!password){
        res.status.send("Password is required");
        // throw new ApiError(400,"Password is required");
    }
    // email or username based login
    const user = await User.findOne({
        email
    })

    if(!user){
        throw  new ApiError(404,"User Not Found");
    }

    // check password
    const validation = await user.isPasswordCorrect(password);
    if(!validation){
        throw  new ApiError(401,"Wrong Password");
    }

    // if password is correct then generate refresh token and  access token
    const {refreshToken , accessToken} = await generateRefreshAndAccessToken(user._id);

    const loggedUser = await User.findById(user._id).select("-password -refreshToken");

    const  options = {
        httpOnly : true,
        secure : true,
        sameSite: 'None'
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json({
        user : loggedUser,
        accessToken,
        refreshToken
    });

}));


const generateRefreshAndAccessToken = async(userId)=>{
    try{
        const user = await User.findById(userId);
        const accessToken =  user.generateAccessToken();
        const refreshToken =  user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave : false})

        return {refreshToken, accessToken};
    }catch{
        res.status(500).send("ERROR in generating Refresh Token and Access Token")
        // throw new ApiError(500,"ERROR in generating Refresh Token and Access Token");
    }

}

// Create a new blog
app.post("/blog/create" , verifyJWT , upload.single("blogImage") , asyncHandler(async (req, res) => {
        try {
            const { content , title   } = req.body;
            const  owner  = req?.user._id +"";
            const blogImagePath = req?.file?.path;

            console.log(content +"  " + title+" "+owner+" "+blogImagePath+" ");
            

            if([content , title , blogImagePath , owner].some((field) => field.trim() === "")){
                res.status(400).send("All fields are required !!");
            }

             // Validate owner existence
             const user = await User.findById(owner);
             if (!user) {
                 return res.status(404).json({ message: "User not found" });
             }

            const blogImage = await uploadOnCloudinary(blogImagePath);

            if(!blogImage){
                res.status(500).send("ERROR :: while uploading to cloudinary")
            }

            const blog = await Blog.create({
                owner,
                title,
                content,
                image : blogImage?.secure_url  || "N/A"
            });

            if(!blog){
                res.status(500).send("ERROR :: while inserting into DB")
            }

            res.status(201).json(blog);
        } catch (error) {
            res.status(500).json({ message: error.message + " 1232" });
        }
    }
))

// Fetch a single blog by blog ID
app.get("/blog/:blogId", verifyJWT , asyncHandler(async (req, res) => {
    try {
        const { blogId } = req.body;
        console.log(blogId);
        
        const blog = await Blog.findById(blogId).populate("owner", "username email");

        blow.views+=1;
        await blog.save();


        if (!blog) {
            return res.status(404).json({ message: "Blog not found 3we3" });
        }

        res.status(200).json(blog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}))

// Fetch all blogs
app.get("/blog/all" , asyncHandler(async (req, res) => {
    try {
        const blogs = await Blog.find().populate("owner", "username email").sort({ createdAt: -1 });
        res.status(200).json(blogs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}))

// import Community from "../models/Community.js";
// import User from "../models/User.js";
import mongoose from "mongoose";
// import asyncHandler from "express-async-handler";

// Get all communities //verifiedInPostMan
app.get("/getCommunities/all",asyncHandler(async (req, res) => {
    const communities = await Community.find().populate("createdBy", "username email");
    res.status(200).json(communities);
}))

//Verified
app.post("/createCommunity",verifyJWT, asyncHandler(async (req, res) => {
    try {
        const { name, description,theme } = req.body;
        const createdBy = req.user._id; // Assuming the user ID is extracted from JWT

        // Validate required fields
        if (!name || !description) {
            return res.status(400).json({ message: "Name and description are required" });
        }

        // Check if community with the same name exists
        const existingCommunity = await Community.findOne({ name });
        if (existingCommunity) {
            return res.status(400).json({ message: "Community with this name already exists" });
        }

        // Create the community
        const community = await Community.create({
            name,
            theme,
            description,
            createdBy,
            members: [createdBy] // Add creator as first member
        });

        res.status(201).json({
            message: "Community created successfully",
            community
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}))


// Get a community by ID //VErifiedPostMan
app.get("/getCommunity/:id", asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid community ID" });
        }

        // Fetch community and populate createdBy and posts
        const community = await Community.findById(id)
            .populate("createdBy", "username email")
            .populate("posts");

        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }

        res.status(200).json({
            ...community.toObject(),
            memberCount: community.members.length,
            posts: community.posts, // Include posts in the response
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}));



// Get communities the user has joined //verifiedInPostMan
app.get("/getUserCommunities/:id",verifyJWT,asyncHandler(async (req, res) => {
    try {
        const { userId } = req.user._id;  // Extract userId from request parameters

        // Fetch communities where the user is a member
        const communities = await Community.find({ members: userId })
            .populate("createdBy", "username email");

        if (!communities || communities.length === 0) {
            return res.status(404).json({ message: "No communities found for this user" });
        }

        res.status(200).json(communities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}))



// Join a Community
app.post("/joinCommunity/:communityId",verifyJWT,asyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const userId = req?.user._id; // Assuming user ID is extracted from JWT middleware

    if (!mongoose.Types.ObjectId.isValid(communityId)) {
        return res.status(400).json({ message: "Invalid community ID" });
    }

    const community = await Community.findById(communityId);
    if (!community) {
        return res.status(404).json({ message: "Community not found" });
    }

    // Check if user is already a member
    if (community.members.includes(userId)) {
        return res.status(400).json({ message: "User is already a member of this community" });
    }

    // Add user to members array
    community.members.push(userId);
    await community.save();

    res.status(200).json({ message: "Successfully joined the community", community });
}))

// Exit from a Community
app.post("/exitCommunity/:communityId",verifyJWT,asyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const userId = req.user.id; // Assuming user ID is extracted from JWT middleware

    if (!mongoose.Types.ObjectId.isValid(communityId)) {
        return res.status(400).json({ message: "Invalid community ID" });
    }

    const community = await Community.findById(communityId);
    if (!community) {
        return res.status(404).json({ message: "Community not found" });
    }

    // Check if user is a member
    if (!community.members.includes(userId)) {
        return res.status(400).json({ message: "User is not a member of this community" });
    }

    // Remove user from members array
    community.members = community.members.filter(member => member.toString() !== userId);
    await community.save();

    res.status(200).json({ message: "Successfully exited the community", community });
}))

//ADD posts to community
// import Post from "../models/Post.js"; // Ensure correct path to Post model

app.post("/addPost/:communityId", verifyJWT, asyncHandler(async (req, res) => {
    try {
        const { communityId } = req.params;
        const { title, description } = req.body;
        const userId = req.user._id +""; // Extract user ID from JWT middleware
        // console.log(title,description);


        // Validate community ID
        if (!mongoose.Types.ObjectId.isValid(communityId)) {
            return res.status(400).json({ message: "Invalid community ID" });
        }
        // console.log(title,description);
        // Find the community
        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }
        // console.log(title,description);
        // Create a new post
        const newPost = new Post({
            owner: userId,
            title,
            description,
            image: "", // Optional field
            likes: 0, // Default value
        });
        // console.log(title,description);
        // Save the post
        const savedPost = await newPost.save();

        // Add post to the community's post list
        community.posts.push(savedPost._id);
        await community.save();
        // console.log(title,description);
        res.status(201).json({
            message: "Post added successfully",
            post: savedPost
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}));



export  { app };
