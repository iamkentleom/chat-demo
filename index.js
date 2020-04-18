const express = require('express')
const sqlite3 = require('sqlite3')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()

const server = require('http').Server(app)
const io = require('socket.io')(server)

const port = process.env.PORT || 3000

server.listen(port, () => {
    console.log(`Server is running on port ${ server.address().port }`)
})


let db = new sqlite3.Database('database.db', sqlite3.OPEN_READWRITE, err => {
    if(err){
        console.error(`Can't open database. ${ err.message }`)
    }else{
        console.log('Connected to the database.')
    }
})

app.use(cors())
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))


app.get('/messages', (req, res) => {

    const query = 'SELECT * from messages'
    console.log('Requesting messages...')

    db.all(query, [], (err, rows) => {
        if(err){
            res.send(err.message)
        }else{
            res.send(rows)
        }
    })
})

app.post('/messages', (req, res) => {
    let name = req.body.name
    let message = req.body.message
    const query = `insert into messages values( NULL,'${ name }', '${ message }')`
    db.run(query, err => {
        if(err){
            res.sendStatus(500)
        }else{
            io.emit('message', req.body)
            res.sendStatus(200)
        }
    })

})

app.use(function (req, res, next) {
    res.status(404).sendFile(__dirname + '/public/404.html')
})

io.on('connection', () => {
    console.log(`${ Date.now() } A user is connected.`)
})