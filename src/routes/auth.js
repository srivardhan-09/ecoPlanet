import jwt from 'jsonwebtoken';
// import {ApiError} from "../utils/ApiError.js";
import User from "../models/usermodel.js";
import {asyncHandler} from "../utils/asyncHandler.js";


export const verifyJWT = asyncHandler(async(req, res, next) => {
    try{
        const accessToken = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');

        const token = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

        if(!token){
            // console.log('Token :: ',token);
            // throw new ApiError(401, 'Unauthorized access token');
            
            res.status(401).send("Unauthorized access token")
        }
        const user = await User.findById(token?._id).select('-password -refreshToken');

        if(!user){

            // console.log('User :: ',user);
            res.status(401,"Unauthorized access token");
            // throw new ApiError(401, 'Unauthorized access token');
        }

        req.user = user;
        next();

    }catch(err){
        throw new ApiError(401, 'Unauthorized Access :: ' +err.message);
        res.status(401).send('Unauthorized Access :: ' +err.message);
    }
})