const express = require('express')
const sqlite3 = require('sqlite3').verbose()
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
    const query = `insert into messages values( NULL, ?, ?)`
    db.run(query, [name, message], function(err){
        if(err){
            res.sendStatus(500)
        }else{
            req.body.message_id = this.lastID
            io.emit('message', req.body)
            res.sendStatus(200)
            console.log('added a message')
        }
    })

})

app.delete('/messages', (req, res) => {
    const query = `delete from messages where message_id = ${ req.body.id }`
    db.run(query, err => {
        if(err){
            res.sendStatus(500)
        }else{
            io.emit('delete_message', req.body)
            res.sendStatus(200)
        }
    })
    console.log('deleted a message')
})

app.use(function (req, res, next) {
    res.status(404).sendFile(__dirname + '/public/404.html')
})

io.on('connection', (user) => {
    console.log(`${ Date.now() } - User ${ user.id } is connected.`)
    user.on('disconnect', () => console.log(`${ user.id } disconnected`))
})