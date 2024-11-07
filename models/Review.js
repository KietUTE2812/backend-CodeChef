import mongoose from "mongoose";

const Schema = mongoose.Schema;
const reviewSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    comment: {
        type: String,
        required: true,
        maxlength: 5000
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    status: {
        type: String,
        enum: ['deleted', 'active'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

export default mongoose.model('Review', reviewSchema);