import { MongoClient } from 'mongodb';

async function checkMongo() {
  const uri = 'mongodb://isaqaadmin:password@44.240.110.54:27017/isa_qa';
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    console.log('Connected to MongoDB!');
    const db = client.db('isa_qa');
    const col = db.collection('device_events');
    
    for (const modId of [4567, 4566, 4565]) {
      const event = await col.findOne({ module_id: modId }, { sort: { created_at_timestamp: -1 } });
      console.log(`Latest event for module ${modId}:`, JSON.stringify(event, null, 2));
    }
  } catch (err) {
    console.error('Mongo Error:', err.message);
  } finally {
    await client.close();
  }
}

checkMongo();
