import mongoose from "mongoose";
import express from "express";
import Attendance from "./src/models/attendances.js";

const app = express();

const bookSchema = new mongoose.Schema({
    bookId:{type:mongoose.Types.ObjectId},
    bookName:{type:String},
    authorId:{type:mongoose.Schema.Types.ObjectId, ref:"Author"}
})

const Book = mongoose.model("Book", bookSchema);

const authorSchema = new mongoose.Schema({
    authorId:{type:mongoose.Schema.Types.ObjectId},
    authorName:{type:String}
})

const Author = mongoose.model("Author", authorSchema);

app.get("/",async (req, res)=>{

    
    // Book.find({}).populate("authorId")
    // .then((result)=>{
    //     res.json(result)
    // }) 
    
    Attendance.find({})
    .then((result)=>{
        res.json(result);
    })
})

mongoose.connect("mongodb://127.0.0.1:27017/BOOK_STORE")
.then()
.catch();

app.listen(4000, ()=>{})