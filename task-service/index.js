const express = require('express')
const { createServer } = require('http')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const {StatusCodes} = require('http-status-codes')
const amqp = require('amqplib')

const app = express()
const http_server = createServer(app)

mongoose.connect('mongodb://mongo:27017/tasks')
  .then(()=>console.log('Tasks db Connected'))
  .catch((err)=>console.log(`${err?.message}`))

const TaskSchema = new mongoose.Schema({ 
    title:String,
    description:String,
    createdAt:{
        type:Date,
        default:Date.now
    },
    userId:String
})

const Task = mongoose.model('Task',TaskSchema)

let channel, connection

async function connectRabbitMQ(retries = 5, delay = 3000) {
    while(retries) {
        try {
            connection = await amqp.connect("amqp://rabbitmq:5672")  
            channel = await connection.createChannel()
            await channel.assertQueue("task_created", {durable:true})
            console.log('Task service connected to RabbitMQ')
            return
        } catch (error) {
            console.error('Error connecting to RabbitMQ:', error.message)
            retries--
            await new Promise((res) => setTimeout(res, delay))
        }
    }
}

app.use(express.json())

app.get('/task-test',(req,res)=>{
    res.status(StatusCodes.OK).json({message: 'Task Service Live'})
})

app.post('/new-task',async(req,res)=>{
    const {title,description,userId} = req.body
    try {
        const task = new Task({title,description,userId})
        await task.save()
        
        if (channel) {
            const message = {
                taskId: task._id.toString(),
                userId,
                title,
                description
            }
            channel.sendToQueue(
                "task_created",
                Buffer.from(JSON.stringify(message)),
                { persistent: true }
            )
            console.log("Published task notification to queue")
        } else {
            console.warn('RabbitMQ not connected, notification not sent')
        }
        
        res.status(StatusCodes.CREATED).json(task) 
    } catch (error) {
        console.error(error)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({error: error.message}) 
    }
})

app.get('/all-tasks',async (req,res)=>{
    try {
        const tasks = await Task.find()
        res.status(StatusCodes.OK).json(tasks)
    } catch (error) {
        console.error(error)
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({error: error.message})
    }
})

app.listen(5000, async () => { 
    console.log('Task service live on port 5000!')
    await connectRabbitMQ()
})