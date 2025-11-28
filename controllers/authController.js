const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// --- REGISTER ---
exports.register = (req, res) => {
    const { student_code, name, email, password } = req.body;

    const hashed = bcrypt.hashSync(password, 10);

    db.query(
        "INSERT INTO students (student_code, name, email, password_hash) VALUES (?, ?, ?, ?)",
        [student_code, name, email, hashed],
        (err, result) => {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "User registered!" });
        }
    );
};

// --- LOGIN ---
exports.login = (req, res) => {
    const { email, password } = req.body;

    db.query(
        "SELECT * FROM students WHERE email = ?",
        [email],
        (err, results) => {
            if (err) return res.status(400).json({ error: err.message });
            if (results.length === 0)
                return res.status(404).json({ message: "User not found" });

            const user = results[0];

            const isValid = bcrypt.compareSync(password, user.password_hash);

            if (!isValid)
                return res.status(401).json({ message: "Wrong password" });

            // Token
            const token = jwt.sign({ id: user.id }, "secretkey", {
                expiresIn: "7d",
            });

            res.json({ message: "Login OK", token });
        }
    );
};

// --- GET ALL USERS ---
exports.getUsers = (req, res) => {
    db.query("SELECT id, student_code, name, email FROM students", (err, results) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(results);
    });
};

// --- UPDATE USER ---
exports.updateUser = (req, res) => {
    const { id } = req.params;
    const { name, student_code } = req.body;

    db.query(
        "UPDATE students SET name=?, student_code=? WHERE id=?",
        [name, student_code, id],
        (err, result) => {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "User updated!" });
        }
    );
};

// --- DELETE USER ---
exports.deleteUser = (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM students WHERE id=?", [id], (err, result) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "User deleted!" });
    });
};
