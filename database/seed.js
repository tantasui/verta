import pool from '../server/config/database.js';

async function seedDatabase() {
  console.log('Seeding database...');

  try {
    // Create sample users
    const usersResult = await pool.query(`
      INSERT INTO users (username, display_name, email, wallet_address, bio, avatar_url)
      VALUES
        ('alice_drama', 'Alice Chen', 'alice@example.com', '0x1234567890abcdef', 'Drama creator and storyteller', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'),
        ('bob_films', 'Bob Martinez', 'bob@example.com', '0xabcdef1234567890', 'Passionate filmmaker', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'),
        ('emma_stories', 'Emma Watson', 'emma@example.com', '0x9876543210fedcba', 'Love telling emotional stories', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma')
      RETURNING id, username
    `);

    console.log(`✓ Created ${usersResult.rows.length} users`);

    const users = usersResult.rows;

    // Create sample dramas
    const dramasResult = await pool.query(`
      INSERT INTO dramas (
        user_id, title, description, video_url, thumbnail_url, duration,
        views_count, likes_count, category, tags, emotional_tags
      )
      VALUES
        (
          $1,
          'The Last Goodbye',
          'A heartbreaking story of love and loss in the city',
          '/videos/sample1.mp4',
          'https://picsum.photos/seed/drama1/400/600',
          180,
          45200,
          3420,
          'Romance',
          ARRAY['love', 'drama', 'city'],
          ARRAY['sad', 'romantic']
        ),
        (
          $2,
          'Unexpected Turn',
          'When life takes an unexpected turn, she must make a choice',
          '/videos/sample2.mp4',
          'https://picsum.photos/seed/drama2/400/600',
          240,
          78900,
          5670,
          'Suspense',
          ARRAY['thriller', 'mystery', 'plot-twist'],
          ARRAY['suspenseful', 'shocked']
        ),
        (
          $3,
          'Coffee Shop Confessions',
          'Two strangers meet at a coffee shop and share their deepest secrets',
          '/videos/sample3.mp4',
          'https://picsum.photos/seed/drama3/400/600',
          150,
          34500,
          2890,
          'Romance',
          ARRAY['romance', 'conversation', 'coffee'],
          ARRAY['romantic', 'happy']
        ),
        (
          $1,
          'The Silent Scream',
          'A psychological thriller about secrets that refuse to stay buried',
          '/videos/sample4.mp4',
          'https://picsum.photos/seed/drama4/400/600',
          200,
          92300,
          7230,
          'Suspense',
          ARRAY['psychological', 'thriller', 'dark'],
          ARRAY['suspenseful', 'shocked', 'angry']
        ),
        (
          $2,
          'Laughter in the Rain',
          'Sometimes the best moments happen when you least expect them',
          '/videos/sample5.mp4',
          'https://picsum.photos/seed/drama5/400/600',
          120,
          56700,
          4320,
          'Comedy',
          ARRAY['comedy', 'feel-good', 'rain'],
          ARRAY['funny', 'happy']
        )
      RETURNING id, title
    `, [users[0].id, users[1].id, users[2].id]);

    console.log(`✓ Created ${dramasResult.rows.length} dramas`);

    const dramas = dramasResult.rows;

    // Create sample playlists
    const playlistsResult = await pool.query(`
      INSERT INTO playlists (user_id, title, description, thumbnail_url)
      VALUES
        ($1, 'Heartbreak Collection', 'Dramas that will make you cry', 'https://picsum.photos/seed/playlist1/400/300'),
        ($2, 'Thrilling Moments', 'Edge of your seat suspense', 'https://picsum.photos/seed/playlist2/400/300'),
        ($3, 'Feel Good Vibes', 'Light-hearted and fun dramas', 'https://picsum.photos/seed/playlist3/400/300')
      RETURNING id, title
    `, [users[0].id, users[1].id, users[2].id]);

    console.log(`✓ Created ${playlistsResult.rows.length} playlists`);

    // Add dramas to playlists
    await pool.query(`
      INSERT INTO playlist_items (playlist_id, drama_id, position)
      VALUES
        ($1, $2, 1),
        ($1, $3, 2)
    `, [playlistsResult.rows[0].id, dramas[0].id, dramas[2].id]);

    console.log('✓ Added items to playlists');

    // Create sample comments
    await pool.query(`
      INSERT INTO comments (drama_id, user_id, content)
      VALUES
        ($1, $2, 'This made me cry! Such a beautiful story 😭'),
        ($1, $3, 'The acting is incredible. Best short drama I have seen!'),
        ($2, $1, 'That plot twist! Did not see it coming!'),
        ($3, $2, 'So wholesome and heartwarming ❤️')
    `, [dramas[0].id, users[1].id, users[2].id, dramas[1].id, users[0].id, dramas[2].id, users[1].id]);

    console.log('✓ Created sample comments');

    // Create sample reactions
    await pool.query(`
      INSERT INTO reactions (drama_id, user_id, emotion)
      VALUES
        ($1, $2, 'sad'),
        ($1, $3, 'romantic'),
        ($2, $1, 'shocked'),
        ($3, $2, 'happy')
    `, [dramas[0].id, users[1].id, users[2].id, dramas[1].id, users[0].id, dramas[2].id, users[1].id]);

    console.log('✓ Created sample reactions');

    // Create sample likes
    await pool.query(`
      INSERT INTO likes (drama_id, user_id)
      VALUES
        ($1, $2),
        ($1, $3),
        ($2, $1),
        ($3, $2),
        ($4, $1)
    `, [dramas[0].id, users[1].id, users[2].id, dramas[1].id, users[0].id, dramas[2].id, users[1].id, dramas[3].id, users[0].id]);

    console.log('✓ Created sample likes');

    console.log('✓ Database seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
