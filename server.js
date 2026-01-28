const express = require('express')
const mongoose = require('mongoose')
const ToDo = require('./model')
const UserData = require('./user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express();
app.use(express.json());

mongoose.connect('mongodb+srv://kajavyshnavi324_db_user:@cluster0.jpu8v9x.mongodb.net/')
    .then(()=> console.log('connected to User'))
    .catch (err =>console.log(err))

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, "this is my secret key", (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    req.user = user; 
    next();
  });
};

app.post("/signup", async(req,res)=>{
    const {username,email,password} = req.body
    try {
         const existingUser = await UserData.findOne({email})
        if(existingUser){
            return res.status(400).json({message: "User already exists"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashed_password = await bcrypt.hash(password, salt);
        const newUser = new UserData({username,email,password :hashed_password });
        await newUser.save();
        const token = jwt.sign({id : newUser._id}, 'this is my secret key',{expiresIn:'1h'});
        return res.json({
            message : "User signup successfully",
            token,
            user:{
                    id:newUser._id,
                    username: newUser.username
            }
            
        })

    }
    catch(err){
    console.log(err);
}
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await UserData.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id },"this is my secret key", { expiresIn: "1h" }
    );
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/create_task", authenticateToken , async(req,res)=>{
    try{
        const {title,description} = req.body;
       const newToDo = new ToDo({
  title,
  description,
  userId: req.user.id   
});

        await newToDo.save();
        return res.status(201).json({
            message: "ToDo created successfully",
            ToDo: newToDo
        });
    
    }
     catch(err){
        console.log(err.message);
        return res.status(500).json({message: "Server error"});
     }
});

app.get('/todos', authenticateToken, async (req, res) => {
  try {
    const todos = await ToDo.find({
      userId: req.user.id   
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Todos fetched successfully",
      todos
    });
  } catch (err) {
    console.error('Todo fetch error:', err);
    return res.status(500).json({ message: 'Server Error' });
  }
});




app.listen (5000,() => console.log('Server is running on http://localhost:5000'));