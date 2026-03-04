import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Buffer;
  contentType: string;
}) {
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function deleteFromR2(key: string) {
  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    }),
  );
}

export async function deleteFolderFromR2(prefix: string) {
  let continuationToken: string | undefined;

  do {
    // 1. List objects with prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME!,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });

    const listResult = await client.send(listCommand);

    if (listResult.Contents && listResult.Contents.length > 0) {
      // 2. Prepare delete objects command
      const objectsToDelete = listResult.Contents.map((obj) => ({
        Key: obj.Key,
      }));

      const deleteCommand = new DeleteObjectsCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Delete: {
          Objects: objectsToDelete,
        },
      });

      // 3. Delete objects
      await client.send(deleteCommand);
    }

    continuationToken = listResult.NextContinuationToken;
  } while (continuationToken);
}
