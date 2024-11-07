import User from "../models/User.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import token from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from 'uuid';

function getCookieValue(cookieString, name) {
    // Tách các cookie thành mảng
    const cookieArray = cookieString.split('; ');

    // Tìm cookie có key là 'name'
    const cookie = cookieArray.find(cookie => cookie.startsWith(name + '='));

    // Trả về giá trị của cookie nếu tìm thấy, ngược lại trả về null
    return cookie ? cookie.split('=')[1] : null;
}

// @desc Login
// @route POST /api/auth/login
// @access Public
const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if(user && user.status === 'block') {
        res.status(401);
        throw new ErrorResponse('Account inactive');
    }
    //Kiểm tra xem user đã tồn tại chưa
    if (user && (await bcrypt.compare(password, user?.password))) {
        //Tạo Refreshtoken
        const refreshToken = token.generateRefreshToken(user._id);
        //Lưu refreshtoken vào db
        await User.findByIdAndUpdate(user._id, { refreshToken }, { new: true });
        //Trả về token ở response và refreshtoken ở cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 3 * 24 * 60 * 60 * 1000
        });
        res.json({
            status: "success",
            message: "Login successfully",
            data: {
                user,
                token: token.generateToken(user._id, user.role)
            }
        });
    } else {
        res.status(401);
        throw new ErrorResponse('Invalid email or password');
    }
})

// @desc Logout
// @route POST /api/auth/logout
// @access Private

const logout = asyncHandler(async (req, res, next) => {
    const cookie = req.headers.cookie;
    if (!cookie) {
        const err = new ErrorResponse('No cookie, no refresh, must logout');
        err.statusCode = 401;
        throw err;
    }
    const refreshToken = getCookieValue(cookie,'refreshToken'); 
    //Kiểm tra xem có cookie và refreshToken không
    if (!refreshToken) {
        const err = new ErrorResponse('No cookie, no refresh, must logout');
        err.statusCode = 401;
        throw err;
    }
    //Xóa refreshToken trong db
    await User.findOneAndUpdate({ refreshToken }, { refreshToken: '' }, { new: true });
    //Xóa refreshToken trong cookie
    res.clearCookie('refreshToken');
    res.json({
        status: "success",
        message: "Logout successfully"
    });
})

// @desc Refresh token
// @route POST /api/auth/refresh-token
// @access Private
const refreshToken = asyncHandler(async (req, res, next) => {
    const cookie = req.headers.cookie;
    const refreshToken = getCookieValue(cookie, 'refreshToken');
    if (!cookie && !refreshToken) {
        const err = new ErrorResponse('No cookie');
        err.statusCode = 404;
        throw err;
    }
    await jwt.verify(refreshToken, process.env.JWT_SECRET, async (error, decoded) => {
            if (error) {
                const err = new ErrorResponse('Invalid refresh token, you must login again');
                err.statusCode = 403;
                throw err;
            }
            const user = await User.findById(decoded._id);
            if (!user || user.refreshToken !== refreshToken) {
                const err = new ErrorResponse('User not found or invalid refresh token');
                err.statusCode = 403;
                throw err;
            }
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                sameSite: 'None',
                maxAge: 3 * 24 * 60 * 60 * 1000
            });
            res.json({
                status: "success",
                message: "Refresh access token successfully",
                data: {
                    success: true,
                    newToken: token.generateToken(user._id, user.role)
                }
            });
        }
    );
})

// @desc Register
// @route POST /api/auth/register
// @access Public
const register = asyncHandler(async (req, res, next) => {
    const { username, email, password, fullname } = req.body;
    const userExists = await User.findOne({ email });
    //Kiểm tra password
    if (password.length < 8 || (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[a-zA-Z\d!@#$%^&*(),.?":{}|<>]{8,}$/).test(password) === false) {
        res.status(400);
        throw new ErrorResponse('Password is invalid');
    }
    //Kiểm tra xem user đã tồn tại chưa
    if (userExists) {
        res.status(400);
        throw new ErrorResponse('Email already exists');
    }
    const userExistsUsername = await User.findOne({ username });
    //Kiểm tra xem user đã tồn tại chưa
    if (userExistsUsername) {
        res.status(400);
        throw new ErrorResponse('Username already exists');
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
        username: username,
        email: email,
        password: password
    });
    //Tạo verify code
    const code = Math.floor(100000 + Math.random() * 900000);
    const expire = Date.now() + 10 * 60 * 1000;
    user.verifyCode = code;
    user.verifyCodeExpired = expire;
    await user.save();
    //Tạo message
    const message = `Please enter the following code to verify your account: ${code}`;
    //Kiểm tra user đã tạo chưa
    if (user) {
        try {
            await sendEmail({
                title: 'Verify account',
                email: user.email,
                subject: '[Code Chef] Verify your account. Valid for 10 minutes',
                message
            });
        } catch (error) {
            user.verifyCode = '';
            await user.save();
            res.status(500);
            throw new ErrorResponse('Email could not be sent' + error);
        }
        res.status(201).json({
            status: "success",
            message: "User created successfully",
            data: user
        });
    } else {
        res.status(400);
        throw new ErrorResponse('Invalid user data');
    }
})

// @desc Verify email
// @route POST /api/auth/verify-email
// @access Public
const verifyEmail = asyncHandler(async (req, res, next) => {
    const { code } = req.body;
    const user = await User.findOne({ verifyCode: code });
    if (!user) {
        res.status(400);
        throw new Error('Invalid code');
    }
    if (Date.now() > user.verifyCodeExpired) {
        res.status(400);
        throw new Error('Code expired');
    }
    user.verifyCode = '';
    user.status = 'active';
    await user.save();
    res.status(200).json({
        status: "success",
        message: "Email verified successfully"
    });
})

// @desc Forgot password
// @route POST /api/auth/forgot-password
// @access Public
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error("User not found with this email");
    }

    // Tạo token chứa 10 ký tự ngẫu nhiên
    const resetToken = Math.floor(100000 + Math.random() * 900000);
    const resetExpire = Date.now() + 10 * 60 * 1000;
    user.verifyForgotPassword = resetToken;
    user.verifyForgotPasswordExpired = resetExpire;
    await user.save(); // Lưu token và thời gian hết hạn vào db

    // Tạo nội dung email
    const message = `Please enter the following code to reset your password: ${resetToken}`;

    try {
        // Send the email
        await sendEmail({
            email: user.email,
            subject: 'Your Password Reset Token (valid for 10 minutes)',
            message
        });

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
    } catch (err) {
        throw new Error("There was an error sending the email. Try again later.");
    }
});

// @desc Reset password
// @route POST /api/auth/reset-password
// @access Public
const resetPassword = asyncHandler(async (req, res) => {
    const { code, password } = req.body;

    try {
        // Xác thực token
        const user = await User.findOne({ verifyForgotPassword: code, verifyForgotPasswordExpired: { $gt: Date.now() } });

        // Kiểm tra user
        if (!user) {
            throw new Error("User not found or token has expired");
        }

        // Set new password
        user.password = password
        user.verifyForgotPassword = '';
        user.verifyForgotPasswordExpired = '';
        await user.save();

        // Send response
        res.status(200).json({
            status: 'success',
            message: 'Password reset successful!',
            token: token.generateToken(user._id, user.role),
        });
    } catch (err) {
        // Handle invalid or expired token
        throw new Error("Token is invalid or has expired" + err);
    }
});

export default { login, logout, refreshToken, register, verifyEmail, forgotPassword, resetPassword };