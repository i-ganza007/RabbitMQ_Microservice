const express = require('express')
const { createServer } = require('http')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const {StatusCodes} = require('http-status-codes')
const {specs , swaggerUi} = require('./swagger/swagger-config')

const app = express()
const http_server = createServer(app) 

mongoose.connect('mongodb://localhost:27017/users').then(()=>console.log('MGDB Connected')).catch(err=>console.error(err))

const UserSchema = new mongoose.Schema({
    name:String,
    age:String
,})

const User = mongoose.model('User',UserSchema)

app.use('/api-docs',swaggerUi.serve,swaggerUi.setup(specs))
app.use(bodyParser.json())


app.get('/test',(req,res)=>{
    res.status(StatusCodes.OK).json({message:'Test working'})
})

app.get('/all-users',async (req,res)=>{
    const users = await User.find()
    res.status(StatusCodes.OK).json(users)
})

app.post('/users',async (req,res)=>{
   const {name,email} = req.body
   try {
    const user = new User({name,email})
    await user.save()
    res.status(StatusCodes.CREATED).json(user)
   } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error)
   }
})

http_server.listen(4000,()=>{
    console.log('Server is live PAPA!');  
})
