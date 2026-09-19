const jsonServer = require('json-server')

const server = jsonServer.create()
const router = jsonServer.router('db.json')
const port = Number(process.env.PORT || 3000)

server.use(jsonServer.defaults())
server.use(jsonServer.bodyParser)
server.use(router)
server.listen(port, '0.0.0.0', () => {
  console.log(`JSON Server is running on port ${port}`)
})
