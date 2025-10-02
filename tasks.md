# ReelShort MVP: Walrus Integration Tasks

**Goal**: Build a **minimum viable demo** of ReelShort with Walrus integration.
**Focus**: Upload dramas as quilts, stream them, and cache for performance.

---

## **📌 Task 1: Set Up Backend Dependencies**
**What to do**:
Install all required npm packages for the backend.

**Explanation**:
- `@mysten/walrus` and `@mysten/sui` are needed to interact with Walrus and Sui blockchain.
- `express` for the server, `pg` for PostgreSQL, and `redis` for caching.
- `fluent-ffmpeg` and `ffmpeg-static` for splitting videos into chunks.
- `multer` for handling file uploads.

**How to verify**:
Run `npm install` and check `package.json` for the dependencies.

---

## **📌 Task 2: Configure Environment Variables**
**What to do**:
Create a `.env` file in the backend with the required variables.

**Explanation**:
- `SUI_RPC_URL`: Connects to Sui Testnet.
- `WALRUS_PACKAGE_ID`: Identifies your Walrus package.
- `ADMIN_SECRET_KEY`: A funded Sui wallet keypair for uploading dramas.
- `DB_URL` and `REDIS_URL`: Database and caching connections.
- `JWT_SECRET`: For user authentication.

**How to verify**:
Check that the `.env` file exists and all variables are set.

---

## **📌 Task 3: Initialize Walrus and Redis Clients**
**What to do**:
Create utility files to initialize the Walrus and Redis clients.

**Explanation**:
- **Walrus Client**: Connects to Walrus for storing/retrieving video chunks as quilts.
- **Redis Client**: Caches frequently accessed video chunks to reduce latency.

**Files to create**:
- `walrusClient.ts`: Initializes the Walrus client with the admin keypair.
- `redisClient.ts`: Initializes the Redis client for caching.

**How to verify**:
Import and log the clients in `app.ts` to ensure they initialize without errors.

---

## **📌 Task 4: Set Up Video Processing Utilities**
**What to do**:
Create a utility to split videos into chunks using `ffmpeg`.

**Explanation**:
- Videos are split into **5MB chunks** for efficient storage as quilts.
- `ffmpeg` is used for chunking and generating thumbnails.

**File to create**:
- `ffmpegUtils.ts`: Contains functions for splitting videos and generating thumbnails.

**How to verify**:
Test the utility with a sample video file to ensure chunks are created correctly.

---

## **📌 Task 5: Create Database Models**
**What to do**:
Set up PostgreSQL tables for dramas and users.

**Explanation**:
- **Dramas table**: Stores metadata like `title`, `quilt_id`, and `emotional_tags`.
- **Users table**: Stores user data (wallet address, username).

**How to verify**:
Run the SQL script to create tables and confirm they exist in PostgreSQL.

---

## **📌 Task 6: Implement Drama Upload Endpoint**
**What to do**:
Create an endpoint to upload dramas as quilts to Walrus.

**Explanation**:
1. Accepts a video file and metadata (title, emotional tags).
2. Splits the video into chunks.
3. Uploads chunks as a **quilt** to Walrus.
4. Saves metadata to PostgreSQL.

**Endpoint**:
- `POST /api/dramas/upload`

**How to verify**:
Upload a test video and check:
- Quilt is created in Walrus.
- Metadata is saved in PostgreSQL.

---

## **📌 Task 7: Implement Drama Streaming Endpoint**
**What to do**:
Create an endpoint to stream dramas by fetching chunks from Walrus.

**Explanation**:
1. Fetches the `quilt_id` from PostgreSQL.
2. Retrieves chunks from Walrus.
3. Caches chunks in Redis for 1 hour.
4. Streams chunks to the frontend.

**Endpoint**:
- `GET /api/dramas/stream/:dramaId`

**How to verify**:
Stream a test drama and check:
- Video plays smoothly in the frontend.
- Second request is served from Redis cache.

---

## **📌 Task 8: Add Basic Error Handling**
**What to do**:
Implement retry logic for Walrus operations.

**Explanation**:
- Walrus operations can fail due to network issues.
- Retry failed operations up to 3 times with a 1-second delay.

**File to create**:
- `retry.ts`: Utility for retrying failed operations.

**How to verify**:
Simulate a failure (e.g., timeout) and confirm retries work.

---

## **📌 Task 9: Integrate Frontend with Backend**
**What to do**:
Update the frontend to upload and stream dramas.

**Explanation**:
- **Upload**: Send video files to `/api/dramas/upload`.
- **Stream**: Fetch and play videos from `/api/dramas/stream/:dramaId`.

**Files to update**:
- `UploadForm.tsx`: Handles drama uploads.
- `VideoPlayer.tsx`: Streams and plays dramas.

**How to verify**:
- Upload a drama via the frontend and confirm it appears in the database.
- Play the drama in the frontend and confirm it streams smoothly.

---

## **📌 Task 10: Test the MVP**
**What to do**:
Test the full workflow from upload to playback.

**Tests to run**:
1. **Upload Test**:
   - Upload a drama via the frontend.
   - Verify the quilt is created in Walrus.
   - Verify metadata is saved in PostgreSQL.

2. **Streaming Test**:
   - Play the uploaded drama.
   - Verify the video streams without buffering.
   - Verify the second play is served from Redis cache.

3. **Error Test**:
   - Simulate a Walrus failure (e.g., timeout).
   - Verify retries work and the operation eventually succeeds.

**How to verify**:
All tests pass without critical errors.

---

## **📌 Task 11: Dockerize and Deploy (MVP)**
**What to do**:
Containerize the backend and deploy to a cloud provider.

**Explanation**:
- Use Docker to package the backend.
- Deploy to **Render** or **AWS** for testing.

**Files to create**:
- `Dockerfile`: Containerizes the backend.

**How to verify**:
- Backend runs in a Docker container locally.
- Deployed backend is accessible via its URL.

---

## **🎯 MVP Checklist**
- [ ] Backend dependencies installed.
- [ ] Environment variables configured.
- [ ] Walrus and Redis clients initialized.
- [ ] Video processing utilities created.
- [ ] Database models set up.
- [ ] Drama upload endpoint implemented.
- [ ] Drama streaming endpoint implemented.
- [ ] Basic error handling added.
- [ ] Frontend integrated with backend.
- [ ] MVP tested and working.
- [ ] Backend dockerized and deployed.

---

## **📢 Notes for Your AI Editor**
> "Focus **only on the MVP tasks** listed above.
> **Skip advanced features** (e.g., playlists, reactions) for now.
> Let me know if you need clarifications on:
> - Walrus client setup.
> - Video chunking logic.
> - Caching with Redis.
> - Frontend-backend integration."