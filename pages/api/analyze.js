import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { OpenAI } from 'openai';

export const config = { api: { bodyParser: false } };
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  const form = new formidable.IncomingForm({ uploadDir: './public/uploads', keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'File parse error' });

    const jobDescription = fields.jobDescription[0];
    const file = files.cv[0];
    let cvText = '';

    if (file.mimetype === 'application/pdf') {
      const data = await pdfParse(fs.readFileSync(file.filepath));
      cvText = data.text;
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const data = await mammoth.extractRawText({ path: file.filepath });
      cvText = data.value;
    } else {
      return res.status(400).json({ error: 'Unsupported file format' });
    }

    const prompt = `You are an AI assistant. Compare the following job description and CV. Provide:
1. A match score (0 to 100) on how suitable the candidate is.
2. A 3-sentence professional profile summary.

Job Description: ${jobDescription}
CV: ${cvText}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });

    const output = completion.choices[0].message.content;
    const matchScore = parseInt(output.match(/\d+/)?.[0] || '0');
    const profileSummary = output.split('\n').slice(1).join(' ');

    res.status(200).json({ matchScore, profileSummary });
  });
}
