import { getTokenFromHeader } from "../utils/getTokenFromHeader.js"
import { verifyToken } from "../utils/verifyToken.js";
import ErrorResponse from "../utils/ErrorResponse.js";

export const isLoggedin = (req, res, next) => {
    //get token from header
    const token = getTokenFromHeader(req);
    //verify the token
    const decodedUser = verifyToken(token);
    //save the user into req obj
    if (!decodedUser) {
        const error = new ErrorResponse("You need to login first");
        error.statusCode = 401;
        throw error;
    }
    else {
        req.user = decodedUser;
        next();
    }

}