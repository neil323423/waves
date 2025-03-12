import express from 'express';

const router = express.Router();

router.post('/openai/v1/chat/completions', (req, res) => {
    const payload = req.body;

    fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer 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"
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        res.json(data); 
    })
    .catch(error => {
        console.error("Error forwarding request to Groq API:", error);
        res.status(500).json({ error: "Error communicating with Groq API" });
    });
});

export default router;
