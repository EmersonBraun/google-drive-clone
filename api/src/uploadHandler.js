import BusBoy from 'busboy'
import { pipeline } from 'stream/promises'
import fs from 'fs'
import { logger } from './logger'

export default class UploadHandler {
    constructor({ io, socketId, downloadsFolder }){
        this.io = io
        this.socketId = socketId
        this.downloadsFolder = downloadsFolder
    }

    handleFileBytes() {

    }

    async onFile(fieldName, file, filename) {
        const saveTo = `${this.downloadsFolder}/${filename}`
        await pipeline(
            file,
            this.handleFileBytes.apply(this, [filename]),
            fs.createWriteStream(saveTo)
        )

        logger.info(`File [${filename}] finished!`)
    }

    registerEvents(headers, onFinish) {
        const busboy = new BusBoy({ headers })
        busboy.on('file',this.onFile.bind(this))
        busboy.on('finish', onFinish)
        return busboy
    }
}