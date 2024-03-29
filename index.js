require('dotenv').config()
const express = require('express')
const morgan = require('morgan')


const Note = require('./models/note')

const app = express()

//Using default json-parser as middleware
app.use(express.json())

morgan.token("input", function getInput(req) {
  let input  = {};
  if (req.method === "GET") {
    input = req.query
  } else {
    input = req.body
  }
    console.log(input)
    return JSON.stringify(input)
})

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :input'))

app.use(express.static('dist'))

//Using CORS middleware to allow external origins. Origin is called external when is not same server and port than server
//In this case Backend run on (localhost:3100) but the requester or origin is the Frontend(localhost:5173).
const cors = require('cors')
app.use(cors())

/*
//custom middleware to show request details
const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}

app.use(requestLogger)
*/

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/api/notes', (request, response) => {
  Note.find({}).then(notes => {
    response.json(notes)
  })
})

app.get('/api/notes/:id', (request, response, next) => {
  Note.findById(request.params.id)
    .then(note => {
      if (note) {
        response.json(note)
      } else {
        response.status(404).end()
      }
    })

    .catch(error => next(error))
})

//DELETE a resource

app.delete('/api/notes/:id', (request, response, next) => {
  Note.findByIdAndDelete(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

//POST Add a resource

app.post('/api/notes', (request, response, next) => {
  const body = request.body

  const note = new Note({
    content: body.content,
    important: body.important || false,
  })

  note.save()
    .then(savedNote => {
      response.json(savedNote)
    })

    .catch(error => next(error))
})

// END POST Add a resource

// Update a resource
app.put('/api/notes/:id', (request, response, next) => {

  const { content, important } = request.body

  Note.findByIdAndUpdate(
    request.params.id, 

    { content, important },
    { new: true, runValidators: true, context: 'query' }
  ) 
    .then(updatedNote => {
      response.json(updatedNote)
    })
    .catch(error => next(error))
})

//custom middleware after routes to handle non-existent routes
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })

  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

// este debe ser el último middleware cargado
app.use(errorHandler)



const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

