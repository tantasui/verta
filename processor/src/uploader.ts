import fs from 'fs/promises';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromBase64 } from '@mysten/sui/utils';

const WALRUS_PUBLISHER_URL = process.env.WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space';
const PACKAGE_ID = process.env.PACKAGE_ID || '';
const SUI_RPC_URL = process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443';

export interface UploadResult {
  videoId: string;
  txDigest: string;
  blobIds: string[];
  thumbnailBlobId: string;
}

export interface ChunkMetadata {
  blobId: string;
  sequence: number;
  duration: number;
}

/**
 * Upload a blob to Walrus via HTTP API
 */
async function uploadBlobToWalrus(filePath: string, epochs: number = 5): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);

  const response = await fetch(`${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=${epochs}`, {
    method: 'PUT',
    body: fileBuffer,
    headers: {
      'Content-Type': 'application/octet-stream'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to upload blob to Walrus: ${response.statusText}`);
  }

  const result = await response.json();

  // Extract blob ID from response
  if (result.newlyCreated) {
    return result.newlyCreated.blobObject.blobId;
  } else if (result.alreadyCertified) {
    return result.alreadyCertified.blobId;
  }

  throw new Error('Unexpected response from Walrus publisher');
}

/**
 * Upload all chunks and thumbnail to Walrus, then create a Sui video object
 */
export async function uploadVideoToWalrus(
  chunks: string[],
  thumbnail: string,
  title: string,
  description: string,
  chunkDuration: number = 5000 // milliseconds
): Promise<UploadResult> {
  console.log('Uploading chunks to Walrus...');

  // Upload thumbnail
  const thumbnailBlobId = await uploadBlobToWalrus(thumbnail);
  console.log(`Thumbnail uploaded: ${thumbnailBlobId}`);

  // Upload all chunks sequentially
  const blobIds: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const blobId = await uploadBlobToWalrus(chunks[i]);
    blobIds.push(blobId);
    console.log(`Chunk ${i} uploaded: ${blobId}`);
  }

  // Create video on Sui blockchain
  console.log('Creating video object on Sui...');
  const { videoId, txDigest } = await createVideoOnSui(
    title,
    description,
    thumbnailBlobId,
    blobIds,
    chunkDuration
  );

  return {
    videoId,
    txDigest,
    blobIds,
    thumbnailBlobId
  };
}

/**
 * Create a video object on Sui with all chunk metadata
 */
async function createVideoOnSui(
  title: string,
  description: string,
  thumbnailBlobId: string,
  blobIds: string[],
  chunkDuration: number
): Promise<{ videoId: string; txDigest: string }> {
  // Get private key from environment
  const privateKeyBase64 = process.env.SUI_PRIVATE_KEY;
  if (!privateKeyBase64) {
    throw new Error('SUI_PRIVATE_KEY not set in environment');
  }

  // Initialize Sui client
  const client = new SuiClient({ url: SUI_RPC_URL });
  const keypair = Ed25519Keypair.fromSecretKey(fromBase64(privateKeyBase64).slice(1));

  // Create transaction
  const tx = new Transaction();

  // Call create_video function
  tx.moveCall({
    target: `${PACKAGE_ID}::verta::create_video`,
    arguments: [
      tx.pure.string(title),
      tx.pure.string(description),
      tx.pure.string(thumbnailBlobId)
    ]
  });

  // Execute transaction
  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: {
      showEffects: true,
      showObjectChanges: true
    }
  });

  if (!result.effects || result.effects.status.status !== 'success') {
    throw new Error('Failed to create video on Sui');
  }

  // Get the created video object ID
  const createdObjects = result.objectChanges?.filter(
    (change) => change.type === 'created'
  );

  if (!createdObjects || createdObjects.length === 0) {
    throw new Error('No video object created');
  }

  const videoObjectId = (createdObjects[0] as any).objectId;

  // Add all chunks to the video
  for (let i = 0; i < blobIds.length; i++) {
    const chunkTx = new Transaction();
    chunkTx.moveCall({
      target: `${PACKAGE_ID}::verta::add_chunk`,
      arguments: [
        chunkTx.object(videoObjectId),
        chunkTx.pure.string(blobIds[i]),
        chunkTx.pure.u64(i),
        chunkTx.pure.u64(chunkDuration)
      ]
    });

    await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: chunkTx
    });

    console.log(`Added chunk ${i} to video`);
  }

  return {
    videoId: videoObjectId,
    txDigest: result.digest
  };
}
