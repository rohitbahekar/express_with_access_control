var express = require('express')
var app = express();
const JWT = require('jsonwebtoken')
const AccessControl = require('accesscontrol');
app.use(express.json()) // for json body
const ac = new AccessControl();
ac.grant('user')                    // define new or modify existing role. also takes an array.
    .createOwn('post')             // equivalent to .createOwn('post', ['*'])
    .deleteOwn('post')
    .updateOwn('post')
    .readAny('post')
  .grant('admin')                   // switch to another role without breaking the chain
    .extend('user')                 // inherit role capabilities. also takes an array
    .updateAny('post', ['title'])  // explicitly defined attributes
    .deleteAny('post');

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/rbac', {useNewUrlParser: true, useUnifiedTopology: true});

const passport = require('passport')
require('./passport');

const { jwtSecret } = require('./config')

const passportJwt = passport.authenticate('jwt', {session: false})

const userService = require('./services/userService')
const postService = require('./services/postService');

const signToken = (user) =>{
    return JWT.sign({
        iss: 'express_passport',
        sub: user._id,
        iat: new Date().getTime(),
        exp: new Date().getTime() + 3600 // 1 hour after issuance
    },
    jwtSecret
    )
}

app.post('/register', async (req, res) =>{
    try{
        const registered = await userService.find({email: req.body.email})
        if(!registered){
            const createdUser = await userService.create({...req.body, role:'user'})
            res.send(createdUser)
        }else{
            res.send('user already present').status(500)
        }
    }catch(e){
        res.send('Some Err:', e).status(500)
    }
    
})
app.post('/admin/register', async (req, res) =>{
    try{
        const registered = await userService.find({email: req.body.email})
        if(!registered){
            const createdUser = await userService.create({...req.body, role:'admin'})
            res.send(createdUser)
        }else{
            res.send('user already present').status(500)
        }
    }catch(e){
        res.send('Some Err:', e).status(500)
    }
    
})

app.post('/login', async (req, res) =>{
    try{
        const user = await userService.authenticate({email: req.body.email}, req.body.password)
        if(user){
            const signedToken = signToken(user)
            res.send({token : signedToken})
        }else{
            res.send('Invalid email or password').status(500)
        }
    }catch(e){
        res.send('Some Err:', e).status(500)
    }
    
})

app.get('/post/:id', passportJwt,async (req, res) => {
    const permission = ac.can(req.user.role).readAny('post').granted || ac.can(req.user.role).readOwn('post').granted 
    console.log('Permission', permission.granted);
    
    if(permission){
        try{
            const post = await postService.find({_id : req.params.id})
            res.json(post)
        }
        catch(err){
            res.status(500).send(err)
        }
    }else{
        res.status(403).send('Forbidden')
    }
})

app.post('/post', passportJwt,async (req, res) => {
    const permission = ac.can(req.user.role).createOwn('post').granted
    
    if(permission){
        try{
            const post = await postService.create({...req.body, owner: req.user._id})
            res.json(post)
        }
        catch(err){
            console.log({err})
            res.status(500).send(err)
        }
    }else{
        res.status(403).send('Forbidden')
    }
})

app.put('/post/:id', passportJwt,async (req, res) => {
    const postToUpdate = await postService.find({_id:req.params.id})
    if(!postToUpdate){
        res.status(404).send('Post Not found')
        return
    }
    // console.log(req.user, {postToUpdate}, );
    if(ac.can(req.user.role).updateAny('post').granted){
        try{
            const attributes =  ac.can(req.user.role).updateAny('post').attributes
            const toUpdate = {_id: req.params.id}
            attributes.forEach(attr => {
                toUpdate[attr] = req.body[attr]
            });
            const post = await postService.update({_id:req.params.id}, toUpdate)
            res.json(post)
        }
        catch(err){
            res.status(500).send(err)
        }
    }else if(ac.can(req.user.role).updateOwn('post').granted && postToUpdate.owner.toString() == req.user._id.toString()){
        const post = await postService.update({_id:req.params.id, owner: req.user._id}, req.body)
        res.json(post)
    }else{
        res.status(403).send('Forbidden')
    }
})

app.delete('/post/:id', passportJwt, async (req, res) => {
    const postToUpdate = await postService.find({_id:req.params.id})
    if(!postToUpdate){
        res.status(404).send('Post Not found')
        return
    }
    if(ac.can(req.user.role).deleteAny('post').granted || (ac.can(req.user.role).deleteOwn('post').granted && postToUpdate.owner.toString() == req.user._id.toString())){
        try{
            await postService.remove({_id:req.params.id})
            res.send('deleted')
        }
        catch(err){
            console.log(err);
            
            res.status(500).send(err)
        }
    }else{
        res.status(403).send('Forbidden')
    }
    
})

app.get('/profile', passportJwt, (req, res) => {
    res.send(req.user)
})


const port =  5000;
const host = 'localhost'

try{
    app.listen(port, host)
}catch(e){
    console.error('Unable to start server:', e)
}