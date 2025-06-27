import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { error } from "console";
const generateAccessTokenRefreshToken = async (userID) => {
    try {
        const user = await User.findById(userID)
        console.log(user)
        const accessToken = user.generateAccessToken()
        
        const refreshToken = user.generateRefreshToken() // fixed typo here
     
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating tokens")
    }
};
const registerUser = asyncHandler(async (req, res) => {

    const { fullName, email, username, password } = req.body;
    console.log("email:", email, " password:", password);
    console.log("🧾 req.body:", req.body);
    console.log("📁 req.files:", req.files);

    // Check for missing fields
    if ([fullName, email, username, password].some(field => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // Check for existing user
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User already exists with this email or username");
    }

    // ✅ Correct avatar and cover image handling
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }



    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // ✅ Upload to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    if (!avatar?.url) {
        throw new ApiError(500, "Failed to upload avatar");
    }

    // ✅ Create user
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});

// for login 
//input req body
//usrname or email select ,paswwoerd check ,acced and referh toeken , send cookie
const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body

    if ((!username || username.trim() === "") && (!email || email.trim() === "")) {
        throw new ApiError(400, "username or email is required")
    }
    const user = await User.findOne({
        $or: [{ username, email }]
    })
    console.log(user)
    if (!user) {
        throw new ApiError(404, "user doesnt exist , register first")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, " password is not correct")
    }
    const { accessToken, refreshToken } = await generateAccessTokenRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken },
                "user logged in succesfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined
        }
    });

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(202)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "user logged out"));
});

export { registerUser, loginUser,logoutUser };