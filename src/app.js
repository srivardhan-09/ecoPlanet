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


const app = express();
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
// app.use(express.static("public"));
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


app.get("/blog/all" , asyncHandler(async (req, res) => {
    try {
        const blogs = await Blog.find().populate("owner", "username email").sort({ createdAt: -1 });
        res.status(200).json(blogs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}))

// Fetch a single blog by blog ID
app.get("/blog/:blogId", asyncHandler(async (req, res) => {
    try {
        const { blogId } = req.params;
        console.log(`Fetching blog with ID: ${blogId}`);
        
        const blog = await Blog.findById(blogId).populate("owner", "username email");

        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        res.status(200).json(blog);
    } catch (error) {
        console.error(`Error fetching blog with ID: ${blogId}`, error);
        res.status(500).json({ message: error.message });
    }
}));
// Fetch all blogs




export  { app };
