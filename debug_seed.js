
const { exec } = require('child_process');
const fs = require('fs');

console.log("Running seed script...");
exec('npx tsx prisma/seed.ts', { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    const log = `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}\n\nERROR:\n${error ? error.message : 'None'}`;
    fs.writeFileSync('seed_debug.log', log);
    console.log("Done. Log written to seed_debug.log");
});
