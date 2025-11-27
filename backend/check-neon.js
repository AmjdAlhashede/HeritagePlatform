const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_jPgmc4akw9eN@ep-long-night-adgrapqp-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function checkDatabase() {
    try {
        // Check tables
        const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('📊 Tables:', tables.rows.map(r => r.table_name));

        // Check content count
        try {
            const content = await pool.query('SELECT COUNT(*) FROM content');
            console.log('📹 Content count:', content.rows[0].count);
        } catch (e) {
            console.log('❌ Content table error:', e.message);
        }

        // Check performers count
        try {
            const performers = await pool.query('SELECT COUNT(*) FROM performer');
            console.log('🎤 Performers count:', performers.rows[0].count);
        } catch (e) {
            console.log('❌ Performer table error:', e.message);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkDatabase();
