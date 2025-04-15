import { POST } from "@/app/api/upload/route";
import { NextRequest } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
}));

jest.mock("nanoid", () => ({
  nanoid: jest.fn(() => "mocked-nanoid"),
}));

describe("POST /api/upload", () => {
  const mockS3Client = new S3Client();
  const mockSend = jest.spyOn(mockS3Client, "send");

  beforeEach(() => {
    process.env.AWS_REGION = "us-east-1";
    process.env.AWS_ACCESS_KEY_ID = "mocked-access-key";
    process.env.AWS_SECRET_ACCESS_KEY = "mocked-secret-key";
    process.env.AWS_S3_BUCKET_NAME = "mocked-bucket";
    jest.clearAllMocks();
  });

  it("returns 200 and the image URL for a valid image upload", async () => {
    const mockFile = new File(["mock-content"], "image.png", {
      type: "image/png",
    });
    const mockFormData = new FormData();
    mockFormData.append("file", mockFile);

    const mockRequest = new NextRequest("http://localhost", {
      method: "POST",
      body: mockFormData,
    });

    mockSend.mockResolvedValueOnce({});

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.url).toBe(
      "https://mocked-bucket.s3.us-east-1.amazonaws.com/chat-images/mocked-nanoid.png",
    );
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: "mocked-bucket",
        Key: "chat-images/mocked-nanoid.png",
        ContentType: "image/png",
      }),
    );
  });

  it("returns 400 if no file is provided", async () => {
    const mockFormData = new FormData();
    const mockRequest = new NextRequest("http://localhost", {
      method: "POST",
      body: mockFormData,
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Only image uploads are allowed");
  });

  it("returns 400 if the file is not an image", async () => {
    const mockFile = new File(["mock-content"], "document.txt", {
      type: "text/plain",
    });
    const mockFormData = new FormData();
    mockFormData.append("file", mockFile);

    const mockRequest = new NextRequest("http://localhost", {
      method: "POST",
      body: mockFormData,
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Only image uploads are allowed");
  });

  it("returns 500 if the S3 upload fails", async () => {
    const mockFile = new File(["mock-content"], "image.png", {
      type: "image/png",
    });
    const mockFormData = new FormData();
    mockFormData.append("file", mockFile);

    const mockRequest = new NextRequest("http://localhost", {
      method: "POST",
      body: mockFormData,
    });

    mockSend.mockRejectedValueOnce(new Error("S3 upload error"));

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Upload failed");
  });
});
