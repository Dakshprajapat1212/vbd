import express from  "express"
import cors from "cors"
import cookieparser from "cookie-parser"

const app=express();
 app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit:"17kb"}))
app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))
app.use(cookieparser())

 // route import

import userRouter from './routes/user.router.js'

app.use("/api/v1/users",userRouter)

export {app}