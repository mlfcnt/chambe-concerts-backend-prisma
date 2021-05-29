import express from 'express';
import signale from 'signale';
import cors from 'cors';
import dotenv from 'dotenv';
import Prisma from '@prisma/client';

const app = express();
const PORT = process.env.PORT || 5000;
const { PrismaClient } = Prisma;
const prisma = new PrismaClient();
dotenv.config();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('hey');
});

app.get('/concerts', async (req, res) => {
  const concerts = await prisma.concert.findMany();
  res.json({ concerts });
});

app.listen(PORT, () => signale.success(`Server successfully started on port ${PORT}`));

// if (process.env.NODE_ENV === 'production') {
//   (async () => {
//     await saveConcertsEveryHour();
//     // await tweetApresMidi();
//   })();
// }
