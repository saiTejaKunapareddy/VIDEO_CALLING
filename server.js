const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});
const { ExpressPeerServer } = require("peer");
const opinions = {
  debug: true,
}

app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));

let users = {}; // To store online users

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    users[socket.id] = { userId, userName };
    socket.join(roomId);

    io.to(roomId).emit("user-list", Object.values(users));

    socket.on("disconnect", () => {
      delete users[socket.id];
      io.to(roomId).emit("user-list", Object.values(users));
    });

    socket.on("call-user", (data) => {
      io.to(data.to).emit("call-made", {
        offer: data.offer,
        socket: socket.id,
        userName: data.userName
      });
    });

    socket.on("make-answer", (data) => {
      io.to(data.to).emit("answer-made", {
        socket: socket.id,
        answer: data.answer
      });
    });

    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });
  });
});

const PORT = process.env.PORT || 3030;
const IP = process.env.IP || '0.0.0.0';

server.listen(PORT, IP, () => {
  console.log(`Server is running on ${IP}:${PORT}`);
});
