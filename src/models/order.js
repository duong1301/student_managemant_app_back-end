import mongoose from "mongoose";
const {Schema} = mongoose;

const orderSchema = new Schema({
    _id:Number,
    item:String,
    price:Number,
    quantity:Number,
})

export default mongoose.model("Order",orderSchema);