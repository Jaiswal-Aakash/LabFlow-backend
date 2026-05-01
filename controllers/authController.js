// const User = require("../models/User");
const bcrypt = require('bcryptjs');
const generateToken = require("../utils/generateToken");
const filter = require("../utils/bloomFilter");

exports.register = async (req, res) => {
    try{
        let {name, email, password, role} = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
      
        email = email.toLowerCase();

        let userExists = false;
          

        if(!filter.has(email)){

            const user = await User.findOne({email});
            if(user){
                return res.status(400).json({message: "User already exists"});
            }
        }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
    
            const user = await User.create({
                name,
                email,
                password: hashedPassword,
                role,
            });
    

            filter.add(email);

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user),
            });
       
    } catch (error) {
        res.status(500).json({message: error.message});
    }

};

exports.login = async (req, res) => {
    try{
        const {email, password} = req.body;

        if(!email || !password){
            return res.status(400).json({message: "All fields are required"});
        }

        email = email.toLowerCase();

        if(!filter.has(email)){
            return res.status(400).json({message: "User not found"});
        }

        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({message: "Invalid credentials"});
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if(!isPasswordCorrect){
            return res.status(400).json({message: "Invalid credentials"});
        }

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user),
        })

    }
    catch(error){
        res.status(500).json({message: error.message});
    }
};
