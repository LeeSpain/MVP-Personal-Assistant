
const fs = require('fs');
const path = require('path');

// Manually parse .env.local since we might not have dotenv installed or configured in this script context
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');
        let keyFound = false;
        for (const line of lines) {
            if (line.startsWith('OPENROUTER_API_KEY=')) {
                const key = line.split('=')[1].trim();
                console.log(`Found OPENROUTER_API_KEY in .env.local: ${key.substring(0, 10)}...${key.substring(key.length - 4)}`);
                keyFound = true;
                break;
            }
        }
        if (!keyFound) {
            console.log('OPENROUTER_API_KEY not found in .env.local');
        }
    } else {
        console.log('.env.local file not found');
    }
} catch (error) {
    console.error('Error reading .env.local:', error);
}
