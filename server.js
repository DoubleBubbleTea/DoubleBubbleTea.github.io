const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

app.use("/api", require("./routes/authRoutes"));

app.listen(3000, () => {
    console.log("Server chạy port 3000");
});
