/**
Redis session adapter example.
Install: npm i ioredis
Set REDIS_URL environment variable.
*/
const Redis = require('ioredis');
const url = process.env.REDIS_URL || null;
let client = null;
if (url) client = new Redis(url);
module.exports = {
  async save(key, obj) {
    if (!client) throw new Error('Redis no inicializado');
    await client.set(`session:${key}`, JSON.stringify(obj));
  },
  async load(key) {
    if (!client) return null;
    const v = await client.get(`session:${key}`);
    return v ? JSON.parse(v) : null;
  },
  async del(key) {
    if (!client) return null;
    await client.del(`session:${key}`);
  }
};