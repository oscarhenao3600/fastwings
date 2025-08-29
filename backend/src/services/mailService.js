
async function sendEmailStub(to, subject, body){ console.log('--- sendEmailStub ---'); console.log('to',to); console.log('subject',subject); return true; } module.exports = {sendEmailStub};
