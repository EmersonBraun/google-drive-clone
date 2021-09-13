import FileHelper from "./fileHelper.js";
import { logger } from "./logger.js";
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const defaultDownloadsFolder = resolve(__dirname, '../', 'downloads')

export default class Routes {
  io;
  constructor(downloadsFolder = defaultDownloadsFolder) {
    this.downloadsFolder
    this.filehelper = FileHelper
  }

  setSocketInstance(io) {
    this.io = io;
  }

  async get(request, response) {
    const files = await this.filehelper.getFileStatus(this.downloadsFolder ?? defaultDownloadsFolder)
    response.writeHead(200)
    response.end(JSON.stringify(files));
  }

  async post(request, response) {
    logger.info("POST");
    response.end();
  }

  async options(request, response) {
    response.writeHead(204);
    response.end();
  }

  async defaultRoute(request, response) {
    response.end("Hello world");
  }

  handler(request, response) {
    response.setHeader("Acess-Control-Allow-Origin", "*");
    const chosen = this[request.method.toLowerCase()] || this.defaultRoute;
    return chosen.apply(this, [request, response]);
  }
}
