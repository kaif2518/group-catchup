const { parseChat, computeStats, chunkMessages } = require("./utils/whatsappParser");

const sample = `12/05/24, 9:41 pm - Kaif: Exam is on Monday
12/05/24, 9:42 pm - Hamza: Which hall?
Also bring your ID card
12/05/24, 10:05 pm - Kaif: Hall B, 10 am`;

const messages = parseChat(sample);
console.log(messages);
console.log(computeStats(messages));
console.log(chunkMessages(messages).length, "chunk(s)");