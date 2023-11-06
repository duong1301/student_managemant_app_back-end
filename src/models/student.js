import mongoose, { Schema } from "mongoose";

const studentSchema = new mongoose.Schema(
    {
        name: { type: String },
        isTuitionFeesPaid: [
            {
                classId: Schema.Types.ObjectId,
                month: Number,
                year: Number,
                isPaid: Boolean,
            },
        ],
    },
    { timestamps: true }
);

const Student = mongoose.model("student", studentSchema);
export default Student;
