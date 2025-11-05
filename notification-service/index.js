const express = require('express')
const { createServer } = require('http')
const {StatusCodes} = require('http-status-codes')
const amqp = require('amqplib') 

const app = express()
const http_server = createServer(app)

app.use(express.json())

let channel, connection

async function connectRabbitMQ(retries=5, delay=3000) {
    while(retries){
        try {
            connection = await amqp.connect("amqp://rabbitmq:5672")
            channel = await connection.createChannel()
            await channel.assertQueue("task_created", {durable:true})
            console.log("Notification service connected to RabbitMQ")
            consumeMessages()
            return
        } catch (error) {
            console.error("Error connecting to RabbitMQ:", error.message)
            retries--
            await new Promise((res) => setTimeout(res, delay))
        }
    }
}

function consumeMessages() {
    channel.consume("task_created", (message) => {
        if (message) {
            const taskData = JSON.parse(message.content.toString())
            console.log("Received task notification:", taskData)      
            sendNotification(taskData)      
            channel.ack(message)
        }
    })
    console.log("👂 Listening for task notifications...")
}

function sendNotification(taskData) {
    console.log(`Sending notification for task: ${taskData.title}`)
    console.log(`   To User: ${taskData.userId}`)
    console.log(`   Task ID: ${taskData.taskId}`)
}



app.listen(6000, async () => {  
    console.log('Notification service live on port 6000!')
    await connectRabbitMQ()
})