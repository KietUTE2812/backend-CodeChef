import User from '../models/User.js';
import asyncHandler from "../middlewares/asyncHandler.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import querystring from 'querystring';


// @desc    Create User
// @route   POST /api/v1/users
// @access  Private Admin
const createUserCtrl = asyncHandler(async (req, res) => {
    const { username, email, password, fullname, role } = req.body;
    const userExists = await User.findOne({ email });
    //Kiểm tra password
    if (password.length < 8 || (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[a-zA-Z\d!@#$%^&*(),.?":{}|<>]{8,}$/).test(password) === false) {
        res.status(400);
        throw new Error('Password is invalid');
    }
    //Kiểm tra xem user đã tồn tại chưa
    if (userExists) {
        res.status(400);
        throw new Error('Email already exists');
    }
    const userExistsUsername = await User.findOne({ username });
    //Kiểm tra xem user đã tồn tại chưa
    if (userExistsUsername) {
        res.status(400);
        throw new Error('Username already exists');
    }

    // //Băm password
    // const salt = await bcrypt.genSalt(10)
    // const hashedPassword = await bcrypt.hash(password, salt)
    //Tạo user
    const userId = uuidv4();
    const user = await User.create({
        userId: userId,
        profile: {
            fullname: fullname,
        },
        role: role,
        username: username,
        email: email,
        password: password
    });
    //Kiểm tra user đã tạo chưa
    if (user) {
        res.status(201).json({
            status: "success",
            message: "User created successfully",
            data: user
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
})

// @desc Get users by Filter and Pagination
// @route GET api/v1/users?limit=1&page=1&filter={}
// @access Private Admin, Private Intructors
const getUsersCtrl = asyncHandler(async (req, res) => {
    const { limit, page, ...filters } = req.query;
    const query = filters;

    // Filter by email
    if (filters.email) {
        query.email = { $regex: filters.email, $options: 'i' };
    }

    // Filter by fullname
    if (filters.fullname) {
        query['profile.fullname'] = { $regex: filters.fullname, $options: 'i' };
        delete query.fullname;  
    }

    // Filter by username
    if (filters.username) {
        query.username = { $regex: filters.username, $options: 'i' };
    }

    // Filter by role
    if (filters.role) {
        query.role = filters.role;
    }
    if (filters.courseId) {
        query.enrolled_courses = { $in: [filters.courseId] };
    }

    // Filter by status
    if (filters.status) {
        query.status = filters.status;
    }
    console.log(query); 
    const users = await User.find(query)
        .limit(limit)
        .skip(limit * (page - 1));
    const total = await User.countDocuments(query);

    res.status(200).json({
        status: "success",
        total,
        limit,
        page,
        data: {
            users
        }
    });
});

// @desc Get user by Id
// @route GET api/v1/users/:id
// @access Public
export const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password -refreshToken');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    res.status(200).json(user);
});

// @desc Update user by Id
// @route PUT api/v1/users/:id
// @access Private
const updateUserCtrl = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new ErrorResponse('User not found');
    }
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })
    res.status(200).json(updatedUser);
});

// @desc Delete user by Id
// @route DELETE api/v1/users/:id
// @access Private Admin
const deleteUserCtrl = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    user.status = 'blocked';
    await user.save();  
    res.status(200).json({
        status: "success",
        message: "User removed successfully"
    });
});
export default { createUserCtrl, getUsersCtrl, getUserById, updateUserCtrl, deleteUserCtrl };