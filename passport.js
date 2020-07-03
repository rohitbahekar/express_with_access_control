const passport = require('passport')
const { ExtractJwt } = require('passport-jwt')
const JwtStrategy = require('passport-jwt').Strategy
const { jwtSecret } = require('./config')
const userService = require('./services/userService')
passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: jwtSecret,
            passReqToCallback: true 
        },
        async(req, payload, done)=>{
            try{
                const user = await userService.find({_id : payload.sub})
                // if user is not registered
                if(!user){
                    done(null, false) 
                }

                //return user return by store
                // if(typeof user.password !== 'undefined'){
                //     user.password = null
                // }
                req.user = user
                done(null, user)
            } catch(e){
                done(e, false)
            }
        }
    )
)