import express, { Request, Response } from "express";
import multer from 'multer';
import cloudinary from "cloudinary";
import { HotelType } from "../shared/types";
import Hotel from "../models/hotel";
import verifyToken from "../middleware/auth";
import { body } from "express-validator";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024  //5mb
    }
})

// api/my-hotels
router.post(
    "/", 
    verifyToken,[
        body("name").notEmpty().withMessage("Name is required"),
        body("city").notEmpty().withMessage("City is required"),
        body("country").notEmpty().withMessage("Country is required"),
        body("description").notEmpty().withMessage("Description is required"),
        body("type").notEmpty().withMessage("Hotel is required"),
        body("pricePerNight").notEmpty().withMessage("price Per Night is required"),
        body("facilities").notEmpty().withMessage("Facilities is required"),
        body("name").notEmpty().withMessage("Name is required"),

    ],
    upload.array("imageFiles",6),
    async(req: Request, res: Response )=>{
    try {
        const imageFiles = req.files as Express.Multer.File[];
        const newHotel: HotelType = req.body;

        // 1. upload the image to cloudinary ;base64,
        const uploadPromise =imageFiles.map(async(image)=>{
            const b64 = Buffer.from(image.buffer).toString("base64");
            let dataURI ="data" + image.mimetype + ";base64" + b64;
            const res = await cloudinary.v2.uploader.upload(dataURI);
            return res.url;
        });

        const imageUrls = await Promise.all(uploadPromise);
        newHotel.imageUrls = imageUrls;
        newHotel.lastUpdated = new Date();
        newHotel.userId = req.userId;

        // 3. save the new hotel in our database
        const hotel = new Hotel(newHotel);
        await hotel.save();

        // 4. return a 201 status 
        return res.status(201).send(hotel);

    } catch (error) {
        console.log("Error creating hotel: ", error);
        res.status(500).json( {message: "Something went wrong "});
        
    }
});

export default router;