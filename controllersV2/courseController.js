import asyncHandler from "../middlewares/asyncHandler.js";
import Course from "../models/Course.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import User from "../models/User.js";

// @desc Get Courses by Filters
// @route GET /api/v1/courses
// @access Public
const getCourses = asyncHandler(async (req, res, next) => {
    const {limit = 100, page = 1, ...filters} = req.query;
    const query = filters;
    if(filters.title) query.title = new RegExp(filters.title, 'i');
    if(filters.instructor) query.instructor = new RegExp(filters.instructor, 'i');
    if(filters.lowPrice || filters.highPrice) {
        query.price = {$gte: filters.lowPrice || 0};
        if(filters.highPrice) query.price = {...query.filter ,$lte: filters.highPrice};
        delete query.lowPrice;
        delete query.highPrice;
    };
    if(filters.tags) query.tags = {$in: filters.tags.split(',')};
    console.log(query);
    const courses = await Course.find(query).limit(limit).skip(limit * (page - 1)).populate('instructor', 'profile');
    const count = await Course.countDocuments(query);
    if(courses.length === 0) return next(new ErrorResponse('No Course Found'));
    res.status(200).json({
        success: true,
        count,
        limit,
        page,
        data: courses
    })
})

// @desc Get Courses by ID
// @route GET /api/v1/courses/:id
// access Public
const getCourseById = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id).populate('instructor', 'profile');
    if(!course) return next(new ErrorResponse(`Course not found with id of ${req.params.id}`));
    res.status(200).json({
        success: true,
        data: course
    })
})

// @desc Create Course
// @route POST /api/v1/courses
// @access Private Admin, Instructor
const createCourse = asyncHandler(async (req, res, next) => {
    const {title, description, instructor, price, level, tags, photo, isAppoved, approvedBy} = req.body;
    const baseCourseId = tags.map(tag => tag.slice(0, 3)).join("-").toUpperCase();
    const randomNumber = Math.floor(10000 + Math.random() * 90000);
    const courseId = baseCourseId + '-' + randomNumber;
    if(instructor) {
        const instruc = await User.findById(instructor);
        if(!instruc || instruc.role !== 'instructor') return next(new ErrorResponse('Instructor not found', 404));
    }
    if(isAppoved && approvedBy) {
        const admin = await User.findById(approvedBy);
        if(!admin || admin.role !== 'admin') return next(new ErrorResponse('Admin not found', 404));
    }
    const course = await Course.create({
        title,
        courseId,
        description,
        instructor,
        price: parseFloat(price),
        level,
        tags,
        photo,
        isAppoved,
        approvedBy,
    })
    if(course) res.status(201).json({
        success: true,
        data: course
    })
    else
        next(new ErrorResponse('Failed to create Course', 500))
});

// @desc Update Course
// @route PUT /api/v1/courses/:id
// @access Private Admin, Instructor
const updateCourse = asyncHandler(async (req, res, next) => {
    let course = await Course.findById(req.params.id);
    if(!course) return next(new ErrorResponse(`Course not found with id of ${req.params.id}`));
    course = await Course.findByIdAndUpdate(req.params.id, req.body, {new: true});
    if(course) res.status(200).json({
        success: true,
        data: course
    })
    else
        next(new ErrorResponse('Failed to update Course', 500))
});

// @desc Delete Course
// @route DELETE /api/v1/courses/:id
// @access Private Admin, Instructor
const deleteCourse = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id);
    if(!course) return next(new ErrorResponse(`Course not found with id of ${req.params.id}`));
    course.status = 'unpublished';
    res.status(200).json({
        success: true,
        data: {}
    })
});

export default { getCourses, getCourseById, createCourse, updateCourse, deleteCourse };