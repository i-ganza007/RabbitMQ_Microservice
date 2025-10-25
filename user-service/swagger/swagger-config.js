const swaggerJSDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express');
const options = {
    definition:{
        openapi:'3.0.0',
        info:{
            title:'Microservices APP',
            version:'1.0.0',
        }
    },
    apis:['../index.js']
}

const specs = swaggerJSDoc(options)

module.exports = {
    specs,
    swaggerUi
}