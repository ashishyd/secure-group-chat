import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import { logError } from "@/lib/logger";

// Required to parse formData in edge environments
export const config = {
  api: {
    bodyParser: false, // Disable body parsing to handle formData manually
  },
};

// Initialize the S3 client with credentials and region from environment variables
const s3 = new S3Client({
  region: process.env.AWS_REGION!, // AWS region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!, // AWS access key ID
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!, // AWS secret access key
  },
});

/**
 * Handles POST requests to upload an image file to an S3 bucket.
 *
 * @param {NextRequest} req - The incoming HTTP request object.
 * @returns {Promise<NextResponse>} - A response containing the uploaded image URL or an error message.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Parse the formData from the request
    const formData = await req.formData();
    const file = formData.get("file") as File;

    // Validate the uploaded file
    if (!file || !file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image uploads are allowed" }, // Error message for invalid file type
        { status: 400 }, // HTTP 400 Bad Request
      );
    }

    // Generate a unique file name with nanoid
    const fileExtension = file.name.split(".").pop(); // Extract file extension
    const fileName = `chat-images/${nanoid()}.${fileExtension}`; // Construct file path

    // Convert the file to a buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Create the S3 upload command
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!, // S3 bucket name
      Key: fileName, // File path in the bucket
      Body: buffer, // File content
      ContentType: file.type, // MIME type of the file
    });

    // Upload the file to S3
    await s3.send(uploadCommand);

    // Construct the public URL of the uploaded image
    const imageUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    // Return the image URL in the response
    return NextResponse.json({ url: imageUrl }, { status: 200 }); // HTTP 200 OK
  } catch (error) {
    // Log the error and return a generic error response
    logError("S3 Upload Error", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 }); // HTTP 500 Internal Server Error
  }
}
