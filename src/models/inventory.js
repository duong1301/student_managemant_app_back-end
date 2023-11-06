import mongoose from "mongoose";

const {Schema} = mongoose;

const inventorySchema = new Schema({
    _id:Number,
    sku:String,
    description:String,
    instock: Number
})

export default mongoose.model("Inventory",inventorySchema);