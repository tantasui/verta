import pool from '../config/database.js';

/**
 * Save drama chunks to database
 * @param {string} dramaId - Drama ID
 * @param {string} quiltId - Walrus quilt ID
 * @param {Array} patches - Array of quilt patches
 * @param {number} videoDuration - Total video duration in seconds
 * @returns {Promise<void>}
 */
export async function saveDramaChunks(dramaId, quiltId, patches, videoDuration) {
  try {
    const numChunks = patches.length;
    const chunkDuration = videoDuration / numChunks;

    for (const patch of patches) {
      // Extract chunk index from identifier (e.g., "chunk-0" -> 0)
      const chunkIndex = parseInt(patch.identifier.split('-')[1]);

      const startTime = chunkIndex * chunkDuration;
      const endTime = Math.min((chunkIndex + 1) * chunkDuration, videoDuration);

      await pool.query(
        `INSERT INTO drama_chunks (
          drama_id, quilt_id, quilt_patch_id, chunk_index,
          chunk_size, start_time, end_time, duration
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          dramaId,
          quiltId,
          patch.quiltPatchId,
          chunkIndex,
          0, // We'll update this later if needed
          startTime,
          endTime,
          chunkDuration,
        ]
      );
    }

    console.log(`✅ Saved ${numChunks} chunks for drama ${dramaId}`);
  } catch (error) {
    console.error('Error saving drama chunks:', error);
    throw error;
  }
}

/**
 * Get drama chunks from database
 * @param {string} dramaId - Drama ID
 * @returns {Promise<Array>} - Array of chunks
 */
export async function getDramaChunks(dramaId) {
  try {
    const result = await pool.query(
      `SELECT * FROM drama_chunks
       WHERE drama_id = $1
       ORDER BY chunk_index`,
      [dramaId]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting drama chunks:', error);
    throw error;
  }
}

/**
 * Delete drama chunks from database
 * @param {string} dramaId - Drama ID
 * @returns {Promise<void>}
 */
export async function deleteDramaChunks(dramaId) {
  try {
    await pool.query('DELETE FROM drama_chunks WHERE drama_id = $1', [dramaId]);
    console.log(`✅ Deleted chunks for drama ${dramaId}`);
  } catch (error) {
    console.error('Error deleting drama chunks:', error);
    throw error;
  }
}

export default {
  saveDramaChunks,
  getDramaChunks,
  deleteDramaChunks,
};
