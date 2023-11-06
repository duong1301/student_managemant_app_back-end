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

app.get("/", async (req, res) => {
    // Book.find({}).populate("authorId")
    // .then((result)=>{
    //     res.json(result)
    // })

    const result = await Attendance.find({}).populate("studentId");
    console.log(result);
    res.json(result);
});

// class API
app.get("/classes", async (req, res) => {
    const classes = await Class.find({});
    return res.json(classes);
});

app.get("/classes/:id", async (req, res) => {
    const id = req.params.id;
    const _class = await Class.findById(id);
    return res.json(_class);
});

app.post("/classes", async (req, res) => {
    const name = req.body.name;
    const tuitionFee = req.body.tuitionFee;

    if (!name || !tuitionFee) {
        return res.status(400).send("pless send all required filed");
    }

    try {
        const _class = new Class({ name, tuitionFee });
        const result = await Class.create(_class);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).send({ message: error });
    }
});

app.delete("/classes/:id", async (req, res) => {
    const id = req.params.id;
    const result = await Class.findByIdAndDelete(id);
    return res.json(result);
});

// student API

app.get("/students", async (req, res) => {
    const students = await Student.find({});
    res.json(students);
});

app.get("/students/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const student = await Student.findById(id);
        return res.json(student);
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: error });
    }
});

app.get("/students/getByClass/:classId", async (req, res) => {
    const id = req.params.classId;
    const studentAttendances = await Attendance.find({ classId: id });
    const studentIds = studentAttendances.map((student) => {
        return student.studentId;
    });
    const students = studentIds.map(async (studentId) => {
        const student = await Student.findById(studentId);
        return student;
    });

    async function getStudents() {
        return Promise.all(
            studentIds.map(async (studentId) => {
                return await Student.findById(studentId);
            })
        );
    }

    getStudents()
        .then((data) => {
            return res.json(data);
        })
        .catch((err) => {
            console.log(err);
            return res.json({});
        });
});

app.post("/students", async (req, res) => {
    const name = req.body.name;
    const classId = req.body.classId;
    if (!name || !classId) {
        return res.status(400).send({ message: "bad request" });
    }

    const student = new Student({ name });
    const studentId = student._id;
    try {
        const newStudent = await Student.create(student);
        const instance = new Attendance({ studentId, classId });
        await Attendance.create(instance);
        return res.json(newStudent);
    } catch (error) {
        console.log(error);
        return res.status(500).send({ message: error });
    }
});

app.delete("/students/:id", async (req, res) => {
    const id = req.params.id;
    const isIdValid = mongoose.isValidObjectId(id);
    if (isIdValid) {
        try {
            await Attendance.deleteOne({ studentId: id });
            const result = await Student.findByIdAndDelete(id);
            return res.send(result);
        } catch (error) {
            return res.status(500);
        }
    }
    return res.status(400).send({ message: "invalid id" });
});

// attendance

app.get("/attendance", async (req, res) => {
    const attendances = await Attendance.find({});
    res.json(attendances);
});

app.get("/attendance/byClass/:id", async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json([]);
    }
    const { date } = req.query;

    const d = new Date(date);
    if (!d) {
        return res.status(400).json({ message: "invalid date" });
    }

    if (mongoose.isValidObjectId(id)) {
        try {
            const result = await Attendance.find({ classId: id });

            const attendances = result.filter((attendace) => {
                const dates = attendace.dates.map((dateItem) => {
                    return formatDate(dateItem);
                });

                const condition = dates.includes(date);
                return condition;
            });
            const ids = attendances.map((item) => {
                return item.studentId;
            });
            res.json(ids);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error });
        }
    } else {
        res.status(400).json([]);
    }
});

app.post("/attendance", async (req, res) => {
    const studentId = req.body.studentId;
    const classId = req.body.classId;

    if (!studentId || !classId) {
        return res.status(400).send({ message: "bad request" });
    }
    try {
        const isExist = await Attendance.findOne({ studentId, classId });
        if (isExist) {
            return res.status(200).send({ message: "Existed" });
        }
        const instance = new Attendance({ studentId, classId });
        const result = await Attendance.create(instance);
        return res.json(result);
    } catch (error) {
        console.log(error);
        return res.status(500).send({ message: error });
    }
});

app.patch("/attendances/addAttendance", async (req, res) => {
    const { classId, studentId, date } = req.body;
    if (!classId || !studentId || !date) {
        return res.status(400).send("bad request");
    }

    try {
        const attendance = await Attendance.findOne({ classId, studentId });
        if (!attendance) {
            res.send({ message: "not exist" });
        }

        const dates = attendance.dates;
        const d = new Date(date);
        const isExist = dates.filter((item) => {
            return item.getTime() === d.getTime();
        });
        if (isExist.length === 0) {
            dates.push(d);
        }
        attendance.save();
        res.send(attendance);
    } catch (error) {
        console.log(error);
        return res.status(500).send({ message: error });
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

app.patch("/attendances/classAttendances", async (req, res) => {
    const { classId, studentIds, date } = req.body;
    // if (!classId || !Array.isArray(studentIds)) {
    //     return res.status(400).json([]);
    // }

    try {
        const d = new Date(date);
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

app.patch("/attendances/deleteAttendance", async (req, res) => {
    const { classId, studentId, date } = req.body;
    if (!classId || !studentId || !date) {
        return res.status(400).send("bad request");
    }

    try {
        const attendance = await Attendance.findOne({ classId, studentId });
        if (!attendance) {
            res.send({ message: "not exist" });
        }

        const dates = attendance.dates;
        const d = new Date(date);
        const newDates = dates.filter((item) => {
            return item.getTime() != d.getTime();
        });
        attendance.dates = newDates;
        attendance.save();
        res.send(attendance);
    } catch (error) {
        console.log(error);
        return res.status(500).send({ message: error });
    }
});

app.delete("/attendances", async (req, res) => {
    const { studentId, classId } = req.body;
    if (!studentId || !classId) {
        return res.status(400).send({ message: "bad request" });
    }
    try {
        const attendace = await Attendance.findOne({ studentId, classId });
        if (!attendace) {
            return res.send({ message: "not existed" });
        }
        const id = attendace._id;
        const result = await Attendance.findByIdAndDelete(id);
        res.json(result);
    } catch (error) {
        console.log(error);
        return res.status(500).send({ message: error });
    }
});

// tuitionFee

app.get("/tuitionFees", async (req, res) => {
    const { classId, studentIds, year, month } = req.query;

    try {
        const _class = await Class.findById(classId);
        const classTuitionFee = _class.tuitionFee;
        const className = _class.name;

        const attendances_students = await Attendance.find({
            classId,
            studentId: { $in: studentIds },
        }).populate("studentId");

        const newAttendances_student = attendances_students.map((a) => {
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
            const result = {studentId, name, classId, className, year, month, dates, count, tuitionFee };
            return result;
        });

        res.json(newAttendances_student);
    } catch (error) {
        console.log(error);
        res.json(error);
    }
});

app.get("/tuitionFeeByStudent/:studentId", async (req, res) => {
    const { studentId } = req.params;
    const { month, year } = req.query;
    const student = await Student.findById(studentId);
    const attendance = await Attendance.findOne({ studentId });
    const { classId } = attendance;
    const _class = await Class.findById(classId);
    const tuitionFee = _class.tuitionFee;
    const dates = attendance.dates.filter((date) => {
        const d = new Date(date);
        const condition = d.getFullYear() == year && d.getMonth() == month - 1;
        return condition;
    });
    const count = dates.length;
    const monthyTuitionFee = tuitionFee * count;
    return res.send({
        class: _class.name,
        student: student.name,
        tuitionFee,
        count,
        dates,
        monthyTuitionFee,
    });
});

mongoose
    .connect(DB_URL)
    .then(() => {})
    .catch(() => {});

app.listen(PORT, () => {
    console.log("app is running at port " + PORT);
});
