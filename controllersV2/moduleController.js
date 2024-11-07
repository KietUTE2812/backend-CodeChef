import {Module} from '../models/Module.js';
import Course from '../models/Course.js';
import asyncHandler from "express-async-handler";
import ErrorResponse from "../utils/ErrorResponse.js";

// @desc    Get modules
// @route   GET /api/v1/modules
// @access  Public
export const getModules = asyncHandler(async (req, res, next) => {
    const {courseId, ...filters} = req.query;
    if(!courseId){
        return next(new ErrorResponse('No course ID provided', 400));
    }
    const modules = await Module.find({courseId});
    res.status(200).json({ success: true, data: modules });
});

// @desc    Get module
// @route   GET /api/v1/modules/:id
// @access  Public
export const getModule = asyncHandler(async (req, res, next) => {
    const module = await Module.findById(req.params.id).populate('moduleItems');

    if (!module) {
        return next(new ErrorResponse(`Module not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: module });
});

// @desc    Create module
// @route   POST /api/v1/modules
// @access  Private
export const createModule = asyncHandler(async (req, res, next) => {
    const {courseId, title, description} = req.body;
    const index = await Module.countDocuments({courseId});
    const module = await Module.create({
        courseId, index: index+1, title, description
    });
    res.status(201).json({ success: true, data: module });
});

// @desc    Update module
// @route   PUT /api/v1/modules/:id
// @access  Private
export const updateModule = asyncHandler(async (req, res, next) => {
    let module = await Module.findById(req.params.id);

    if (!module) {
        return next(new ErrorResponse(`No module with the id of ${req.params.id}`, 404));
    }

    module = await Module.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({ success: true, data: module });
});

// @desc    Delete module
// @route   DELETE /api/v1/modules/:id
// @access  Private
export const deleteModule = asyncHandler(async (req, res, next) => {
    const module = await Module.findById(req.params.id);

    if (!module) {
        return next(new ErrorResponse(`No module with the id of ${req.params.id}`, 404));
    }

    module.status = 'deleted';
    await module.save();

    res.status(200).json({ success: true, data: {} });
});

export default { getModules, getModule, createModule, updateModule, deleteModule };