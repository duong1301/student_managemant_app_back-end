import mongoose, { SchemaType } from "mongoose";
const {Schema} = mongoose;

const attendanceSchema = new Schema({
    studentId:{type:Schema.Types.ObjectId, ref:"student"},
    classId:{type:Schema.Types.ObjectId, ref:"Class"},
    dates:[
        {type: Date}
    ]
},{timestamps: true})

const Attendance = mongoose.model("attendance",attendanceSchema);
export default Attendance;