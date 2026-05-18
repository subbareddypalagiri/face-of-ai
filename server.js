const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Ikkada nee exact MongoDB link pettu (Brackets < > lekunda)
// Example: "mongodb+srv://subbareddy:Subbareddy@123@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
const mongoURI = "mongodb+srv://subbareddy:Subbareddy%40123@cluster0.qazsltp.mongodb.net/?appName=Cluster0";

mongoose.connect(mongoURI)
  .then(() => console.log('🔥 MongoDB Atlas Connected !'))
  .catch(err => console.error(err));

const ChatSchema = new mongoose.Schema({
  sessionId: String,
  title: String,
  history: Array
});

const Chat = mongoose.model('Chat', ChatSchema);

app.post('/api/chats', async (req, res) => {
  await Chat.findOneAndUpdate(
    { sessionId: req.body.sessionId }, 
    { title: req.body.title, history: req.body.history }, 
    { upsert: true, new: true }
  );
  res.json({ success: true });
});

app.get('/api/chats', async (req, res) => {
  const chats = await Chat.find().sort({ _id: -1 });
  res.json(chats);
});

app.listen(5000, () => console.log('🚀 Server running on port 5000'));