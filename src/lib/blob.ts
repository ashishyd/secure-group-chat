// This helper uses the @azure/storage-blob package to upload a file to Azure Blob Storage.

import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

const AZURE_BLOB_CONNECTION_STRING = process.env.AZURE_BLOB_CONNECTION;
const CONTAINER_NAME = "uploads";

if (!AZURE_BLOB_CONNECTION_STRING) {
  throw new Error(
    "Azure Blob connection string is not set in environment variables.",
  );
}

const blobServiceClient = BlobServiceClient.fromConnectionString(
  AZURE_BLOB_CONNECTION_STRING,
);
const containerClient: ContainerClient =
  blobServiceClient.getContainerClient(CONTAINER_NAME);

/**
 * Ensures that the container exists in Azure Blob Storage.
 */
async function ensureContainerExists(): Promise<void> {
  const exists = await containerClient.exists();
  if (!exists) {
    await containerClient.create();
  }
}

/**
 * Uploads a file to Azure Blob Storage.
 * @param file - The File object extracted from FormData.
 * @returns The URL of the uploaded blob.
 */
export async function uploadToBlob(file: File): Promise<string> {
  await ensureContainerExists();
  const blobName = `${Date.now()}-${file.name}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  // Convert the File to a Buffer.
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await blockBlobClient.uploadData(buffer);
  return blockBlobClient.url;
}
