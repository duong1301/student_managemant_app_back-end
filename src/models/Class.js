import mongoose from "mongoose"
import { float } from "webidl-conversions";
const {Schema} = mongoose;
const classSchema = new Schema({
    name:{type: String},
    tuitionFee: {type: Number },
    schedule:[]
},{
    timestamps:true
})

const Class = mongoose.model("Class", classSchema);
export default Class;