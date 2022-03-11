const env = require('dotenv').config()
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const uri = process.env.dbURI;
const User = require('./userSchema');
const { v4: uuidv4 } = require('uuid');


mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log('connected to db')
    })
    .catch(err => {
        console.log('OOOPS an error!!')
        console.log(err)
    })



const app = express();
const port = 3002

const cookieConfig = {
    sameSite: 'None',
    secure: true
}

app.use(cors({
    origin: 'http://127.0.0.1:3000',
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.get('/login', (req, res) => {
    console.log('incoming')
    res.cookie('name', 'girts5212', cookieConfig)
    res.send('sent you a cookie')
})

app.post('/register', async (req, res) => {
    console.log('trying to register with body: ',req.body.username)
    const foundUser = await User.findOne({
        username: req.body.username
    })
    if (foundUser) {

        const data = {
            logged: true
        }
        res.json(JSON.stringify(data))
    } else {
        const user = new User({
            username: req.body.username
        })
        await user.save()
        const data = {
            logged: true
        }
        res.json(JSON.stringify(data))
    }
})

app.post('/todo', async (req, res) => {
    const username = req.body.username
    console.log('username', username)
    const user = await User.findOne({
        username: username
    })
    if(user.todo.length){
        const todo = user.todo
        res.json(JSON.stringify(todo))
    }else{
        res.json('[]')
    }

})

app.post('/add', async (req, res) => {
    const {
        username,
        todo,
        project
    } = req.body
    const user = await User.findOne({
        username: username
    })
    const todoItem = {
        id: uuidv4(),
        todo,
        projectId: project
    }

    console.log('project')
    console.log(project)

    if (user && !project) {
        user.todo.push(todoItem)
      await  user.save()
        res.sendStatus(200)
    }

    if(user && project){
      const foundProject = user.projects.find((item) => item.id === project)
      const index = user.projects.indexOf(foundProject)
      user.projects[index].todo.push(todoItem)
      console.log(user.projects[index].todo)
      console.log(user.projects)
      user.markModified('projects')
      await user.save()
      console.log(user.projects[index].todo)

      res.sendStatus(200)
    }

    if (!user) {
        res.sendStatus(404)
    }

})

app.post('/delete', async (req, res) => {
    const {
        username,
        todoId,
        projectId
    } = req.body
    const user = await User.findOne({
        username: username
    })

    if(!user){
        res.sendStatus(404)
    }

    if(user && projectId){
        const foundProject = user.projects.find((item) => item.id === projectId)
        const projectIndex = user.projects.indexOf(foundProject)
        const foundTodo = user.projects[projectIndex].todo.find((item) => item.id === todoId)
        const todoIndex = user.projects[projectIndex].todo.indexOf(foundTodo)

        user.projects[projectIndex].todo.splice(todoIndex,1)
        foundTodo.projectId = projectId
        user.complated.push(foundTodo)
        user.markModified('projects')
        await user.save()
        res.sendStatus(200)
    }

    if(user && !projectId){
        const foundTodo = user.todo.find((item) => item.id === todoId )
        user.todo.splice(user.todo.indexOf(foundTodo),1)
        user.complated.push(foundTodo)
       await user.save()
        res.sendStatus(200)
    }
    

})

app.post('/completed', async (req, res) => {
    console.log(req.body.username)
    const username = req.body.username

    const user = await User.findOne({
        username: username
    })
    res.json(user.complated)
})

app.post('/deleteCompleted', async (req, res) => {
    console.log(req.body.username)
    const username = req.body.username
    const todoId = req.body.todoId

    const user = await User.findOne({
        username: username
    })

    const foundTodo = user.complated.find((item) => item.id === todoId )
    user.complated.splice(user.complated.indexOf(foundTodo),1)

    await user.save()
    res.sendStatus(200)

})

app.post('/restore', async (req, res) => {
    const username = req.body.username
    const todoId = req.body.todoId

    const user = await User.findOne({
        username: username
    })

    const foundTodo = user.complated.find((item) => item.id === todoId )

    if (foundTodo.projectId){
        const foundProject = user.projects.find((item) => item.id === foundTodo.projectId )
        const index = user.projects.indexOf(foundProject)
        user.projects[index].todo.push(foundTodo)
        user.markModified('projects')
    }else{
        user.todo.push(foundTodo)
    }

    user.complated.splice(user.complated.indexOf(foundTodo),1)
    await user.save()
    res.sendStatus(200)
})

app.post('/projectAdd', async (req, res) => {
    const username = req.body.username;
    const projectName = req.body.projectName

    const user = await User.findOne({
        username: username
    })

    const project = {
        id: uuidv4(),
        projectName,
        todo: []
    }

    user.projects.push(project)
    await user.save()

    res.sendStatus(200)

})

app.post('/projectDelete', async (req,res) => {
    const {username, projectId} = req.body;

    try{
    const user = await User.findOne({
        username: username
    })

    const foundProject = user.projects.find((item) => item.id === projectId)
    console.log(foundProject)

    const index = user.projects.indexOf(foundProject)

    user.projects.splice(index, 1)
    await user.save()
    res.sendStatus(200)
    }
    catch (e) {
        console.log(e)
    }




})

app.post('/projects', async (req, res) => {
    const username = req.body.username;
    const user = await User.findOne({
        username: username
    })

    if(user.projects.length){
        res.json(user.projects)
    }else{
        res.json([])
    }
})

app.post('/findProject', async (req,res) => {
    const {username, projectId} = req.body

    const user = await User.findOne({
        username: username
    })

    if(user.projects.length){
        try{ 
         const foundProject = user.projects.find((item) => item.id === projectId)
        res.json(foundProject)
        }catch(e){
            console.log(e)
        }
    }else{
        res.json([])
    }
})

app.post('/projectTodos', async (req, res) => {
    const username = req.body.username;
    const projectId = req.body.id
    console.log(projectId)
    console.log('something')
    try{

    const user = await User.findOne({
        username: username
    })
    const foundProject = user.projects.find((item) => item.id === projectId )
    console.log('foundProject')
    console.log(foundProject)

    if(!foundProject){
        console.log('sending empty')
        res.json([])
    }   

    res.json(foundProject)  
    
    } catch(e) {
        console.log('ooops an error')
        console.log(e)
        
    }

})

app.post('/search', async (req,res) => {
    const {username,input} = req.body
    const foundTodos = []

    if(input === ''){
        res.json([])
    }else{

    const user = await User.findOne({
        username: username
    })

    const allTodos = user.todo.filter(item => item.todo.startsWith(input));

    const projectTodos = user.projects.forEach((project) => {
        const foundProjectTodo = project.todo.filter(item => item.todo.startsWith(input))
        if(foundProjectTodo.length){
            foundProjectTodo.forEach((item) => {
                foundTodos.push(item)
            })
        }
    })

    console.log('projectTodos: ',projectTodos)

    if(allTodos.length){
        allTodos.forEach((item) => {
            foundTodos.push(item)
        })
    }

    console.log(foundTodos)

     res.json(foundTodos)
}

})


app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})