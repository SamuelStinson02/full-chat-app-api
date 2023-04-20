const express = require('express');
const { off } = require('process');
const { Socket } = require('socket.io');
const app = express()
const http = require('http').Server(app)

const io = require('socket.io')(http)

const connectedUsers = {}

const offlineMessages = {}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.post('/messages', (req, res) => {
    const { sender, receiver, message } = req.body

    if (connectedUsers[receiver]) {
        io.to(connectedUsers[receiver]).emit('message', { sender, message })
        res.send('Mensaje enviado en vivo')
    } else {
        if (!offlineMessages[receiver]) {
            offlineMessages[receiver] = []
        }

        offlineMessages[receiver].push({ send, message })
        res.send('Mensaje guardado')
    }
})

io.on('connection', (socket) => {
    socket.on('connectUser', (userId) => {
        connectedUsers[userId] = socket.id

        if (offlineMessages[userId]) {
            offlineMessages[userId].forEach(msg => {
                io.to(socket.id).emit('message', { sender: msg.sender, message: msg.message })
            })
        }

        delete offlineMessages[userId]
    })

    socket.on('disconnectUser', (userId) => {
        delete connectedUsers[userId]
    })
})

http.listen(3000, () => {
    console.log('Servidor iniciado');
})