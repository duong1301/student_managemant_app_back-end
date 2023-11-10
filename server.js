import express from "express";
import mongoose from "mongoose";
import Class from "./src/models/Class.js";
import { DB_URL, PORT } from "./src/config.js";
import Student from "./src/models/student.js";
import Attendance from "./src/models/attendances.js";
import { formatDate } from "./src/common/common.js";
import cors from "cors";

const app = express();

app.use(express.json());

app.use(cors());

app.use(express.static("public"));

app.get("/", async (req, res) => {
    res.json({ message: "hello world" });
});

// class API

app.post("/classes", async (req, res) => {
    let name = req.body.name;
    let tuitionFee = Number(req.body.tuitionFee);
    name = ("" + name).trim();

    if (name === "") {
        return res.status(400).json({ message: "name is required" });
    }

    if (!tuitionFee) {
        if (Number.isNaN(tuitionFee)) {
            return res.status(400).json({
                message:
                    "tuition fee is not valid. Tuition fee must be positive",
            });
        }
        return res.status(400).json({ message: "tuition fee is required" });
    }

    if (!Number(tuitionFee))
        if (!name || !tuitionFee) {
            return res.status(400).send("please send all required filed");
        }

    try {
        const _class = new Class({ name, tuitionFee });
        const result = await Class.create(_class);

        res.status(201).json({ isSuccess: true, data: result });
    } catch (error) {
        res.status(500).send({ message: error });
    }
});

app.get("/classes", async (req, res) => {
    try {
        const classes = await Class.find({});
        const count = classes.length;
        return res.status(200).json({ isSuccess: true, count, data: classes });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: err });
    }
});

app.get("/classes/:id", async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "id is not valid" });
        }
        const _class = await Class.findById(id);
        if (_class === null) {
            return res.status(404).json({ message: "class not found" });
        }
        return res.json({ isSuccess: true, data: _class });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error });
    }
});

app.delete("/classes/:id", async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "id is not valid" });
        }
        const attendances = await Attendance.find({ classId: id });
        const studentIds = attendances.map((item) => {
            return item.studentId;
        });

        await Student.deleteMany({ _id: { $in: studentIds } });
        await Attendance.deleteMany({ classId: id });

        const result = await Class.findByIdAndDelete(id);

        if (result === null) {
            return res.status(404).json({ message: "class not found" });
        }
        return res.status(200).json({ isSuccess: true, data: result });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error });
    }
});

// student API

app.post("/students", async (req, res) => {
    let name = req.body.name;
    name = ("" + name).trim();
    const classId = req.body.classId;

    if (!name) {
        return res.status(400).json({ message: "name is required" });
    }

    if (!mongoose.isValidObjectId(classId)) {
        return res.status(400).json({ message: "class id is not valid" });
    }

    const isClassExisted = !!(await Class.findById(classId));

    if (!isClassExisted) {
        return res.status(404).json({ message: "class not found" });
    }

    if (!name || !classId) {
        return res.status(400).send({ message: "bad request" });
    }

    const student = new Student({ name });
    const studentId = student._id;
    try {
        const newStudent = await Student.create(student);
        const attendace = new Attendance({ studentId, classId });
        await Attendance.create(attendace);
        return res.json({ isSuccess: true, data: newStudent });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ message: error });
    }
});

app.get("/students", async (req, res) => {
    try {
        const students = await Student.find({});
        const count = students.length;

        return res.status(200).json({ isSuccess: true, data: students });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error });
    }
});

app.get("/students/:id", async (req, res) => {
    const id = req.params.id;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "id is not valid" });
    }

    try {
        const student = await Student.findById(id);
        if (student === null) {
            return res.status(404).json({ message: "student not found" });
        }
        return res.json(student);
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: error });
    }
});

app.get("/students/classes/:classId", async (req, res) => {
    const id = req.params.classId;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "id is not valid" });
    }

    try {
        const attendances = await Attendance.find({ classId: id });
        const studentIds = attendances.map((student) => {
            return student.studentId;
        });
        const count = studentIds.length;
        if (count === 0) {
            return res.status(200).json({ isSuccess: true, count, data: [] });
        }
        const students = await Student.find({
            _id: {
                $in: studentIds,
            },
        });
        return res.status(200).json({ isSuccess: true, count, data: students });
    } catch (error) {
        return res.json({ message: error });
    }

    // const students = studentIds.map(async (studentId) => {
    //     const student = await Student.findById(studentId);
    //     return student;
    // });

    // async function getStudents() {
    //     return Promise.all(
    //         studentIds.map(async (studentId) => {
    //             return await Student.findById(studentId);
    //         })
    //     );
    // }

    // getStudents()
    //     .then((data) => {
    //         return res.json(data);
    //     })
    //     .catch((err) => {
    //         console.log(err);
    //         return res.json({});
    //     });
});

app.delete("/students/:id", async (req, res) => {
    const id = req.params.id;
    const isIdValid = mongoose.isValidObjectId(id);

    if (!isIdValid) {
        return res.status(400).json({ message: "id is not valid" });
    }

    try {
        await Attendance.deleteMany({ studentId: id });
        const result = await Student.findByIdAndDelete(id);
        if (result === null) return res.status(204).send();
        return res.json({ isSuccess: true, data: result });
    } catch (error) {
        return res.status(500);
    }
});

// attendance

app.get("/attendance", async (req, res) => {
    const attendances = await Attendance.find({});
    res.json(attendances);
});

app.get("/attendances/class/:id", async (req, res) => {
    const { id } = req.params;
    const { date } = req.query;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "id is not valid" });
    }

    const _date = new Date(date);
    if (!_date) {
        return res.status(400).json({ message: "date is not valid" });
    }

    try {
        const attendances = await Attendance.find({ classId: id });
        console.log(date, id);
        const attendancesOfDate = attendances.filter((attendance) => {
            const dates = attendance.dates.map((dateItem) => {
                return formatDate(dateItem);
            });
            const condition = dates.includes(formatDate(_date));
            return condition;
        });
        const ids = attendancesOfDate.map((item) => {
            return item.studentId;
        });
        const count = ids.length;
        res.json({ isSuccess: true, count, data: ids });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error });
    }
});

async function addAttendance(attendances, date) {
    const d = new Date(date);
    attendances.forEach(async (item) => {
        const dates = item.dates;
        const stringDates = dates.map((item) => {
            return formatDate(new Date(item));
        });
        if (!stringDates.includes(formatDate(d))) {
            item.dates = [...dates, d];
            await item.save();
        }
    });
}

async function removeAttendance(attendances, date) {
    const d = new Date(date);
    attendances.forEach(async (item) => {
        const dates = item.dates;
        const stringDates = dates.map((item) => {
            return formatDate(new Date(item));
        });
        item.dates = dates.filter((date) => {
            const dateItem = new Date(date);
            return formatDate(dateItem) !== formatDate(d);
        });
        await item.save();
    });
}

app.patch("/attendances/update", async (req, res) => {
    const { classId, studentIds, date } = req.body;
    if (!mongoose.isValidObjectId(classId)) {
        return res.status(400).json({ message: "class id is not valid" });
    }

    if (!Array.isArray(studentIds)) {
        return res.status(400).json({ message: "student ids is not valied" });
    }
    const _date = new Date(date);
    if (!_date) {
        return res.status(400).json({ message: "date is not valid" });
    }

    try {
        const d = new Date(date);
        if(!d){
            return res.status(400).json({message:"invalid date", data:[]})
        }
        const attendances = await Attendance.find({ classId });
        const ids = attendances.map((student) => {
            return student.studentId;
        });

        //add
        const addList = attendances.filter((item) => {
            return studentIds.includes(item.studentId.toString());
        });

        addAttendance(addList, date);

        //remove
        const removeList = attendances.filter((item) => {
            return !studentIds.includes(item.studentId.toString());
        });
        removeAttendance(removeList, date);

        res.json({ addList, removeList });
    } catch (error) {
        console.log(error);
        res.json([]);
    }
});

// tuitionFee

app.get("/tuitionFees", async (req, res) => {
    const { classId, studentIds, year, month } = req.query;

    try {
        const _class = await Class.findById(classId);
        if (_class === null) throw Error("invalid class");
        const classTuitionFee = _class.tuitionFee;
        const className = _class.name;

        const attendances_students = await Attendance.find({
            classId,
            studentId: { $in: studentIds },
        }).populate("studentId");

        const attendanceOfDate = attendances_students.map((a) => {
            const name = a.studentId.name;
            const studentId = a.studentId._id;
            const dates = a.dates.filter((date) => {
                const d = new Date(date);
                const condition =
                    d.getFullYear() == year && d.getMonth() + 1 == month;
                return condition;
            });

            const count = dates.length;
            const tuitionFee = classTuitionFee * count;
            const result = {
                studentId,
                name,
                classId,
                className,
                year,
                month,
                dates,
                count,
                tuitionFee,
            };
            return result;
        });
        const count = attendanceOfDate.length;
        res.json({ isSuccess: true, count, data: attendanceOfDate });
    } catch (error) {
        console.log(error);
        res.json(error);
    }
});

app.get("/tuitionFee/:studentId", async (req, res) => {
    try {
        const { studentId } = req.params;
        const { month, year } = req.query;
        const student = await Student.findById(studentId);
        const attendance = await Attendance.findOne({ studentId });
        const { classId } = attendance;
        const _class = await Class.findById(classId);
        const tuitionFee = _class.tuitionFee;
        const dates = attendance.dates.filter((date) => {
            const d = new Date(date);
            const condition =
                d.getFullYear() == year && d.getMonth() == month - 1;
            return condition;
        });
        const count = dates.length;
        const monthyTuitionFee = tuitionFee * count;
        return res.json({
            isSuccess: true,
            data: {
                class: _class.name,
                student: student.name,
                tuitionFee,
                count,
                dates,
                monthyTuitionFee,
            },
        });
    } catch (error) {
        res.json({message:error})
    }
});

mongoose
    .connect(DB_URL)
    .then(() => {})
    .catch(() => {});

app.listen(PORT, () => {
    console.log("app is running at port " + PORT);
});
