
import type { NextApiRequest, NextApiResponse } from 'next'
import { Server } from 'socket.io'

const SocketHandler = (req: NextApiRequest, res: any) => {
  const { room } = req.query

  if (res.socket.server.io) {
    console.log('Socket is already running')
    return res.end()
  }
  console.log('Socket is initializing')
  //creates a socket server for each room
  const io = new Server(res.socket.server)
  res.socket.server.io = io

  const users: any = {}
  io.on('connection', (socket) => {
    socket.on(`join`, (user: { name: string; room: string }) => {
      if (!users[user.room]) {
        users[user.room] = []
      }
      users[user.room].push(user.name)

      console.log(`${user.name} joined ${user.room}`)
      socket.join(user.room)
      io.to(user.room).emit('connected_users', users[user.room])
    })

    res.end()
  })
}

export default SocketHandler
