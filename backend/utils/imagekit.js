const ImageKit = require('@imagekit/nodejs');

// Use only the private key like in your demo (mentors used only pvt key)
const client = new ImageKit({
    privateKey: process.env.IMAGEKIT_PVT_KEY
});

async function uploadFile({ buffer, fileName, folder = '' }) {
    const file = await client.files.upload({
        file: await ImageKit.toFile(Buffer.from(buffer)),
        fileName,
        folder
    });
    return file;
}

module.exports = { uploadFile };