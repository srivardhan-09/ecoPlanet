import mongoose from "mongoose";
import {app} from "./app.js";

const connectDB = async()=>{
    try{
        const ConnectionRes = await mongoose.connect(`${process.env.MONGODB_URL}/Ecoplanet`);
        console.log(`\nMongoDB Connection Sucessful HOST : ${ConnectionRes.connection.host}`);
        
    }catch (err){
        console.log('MongoDB Connection Failed :: ' , err);
        process.exit(1);
    }
}


// start the server after connecting to db
connectDB()
.then(()=>{
    let port = process.env.PORT || 8000;
    app.listen(port , ()=>{
        console.log(`Server is Listening on PORT :: ${port}`);
    })
})
.catch((err)=> console.log(`MongoDB Error in Connecting to DB :: ${err}`))