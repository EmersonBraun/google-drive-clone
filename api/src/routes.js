import { dirname, resolve } from "path";
import { pipeline } from "stream/promises";
import { fileURLToPath, parse } from "url";
import FileHelper from "./fileHelper.js";
import { logger } from "./logger.js";
import UploadHandler from "./uploadHandler.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultDownloadsFolder = resolve(__dirname, "../", "downloads");

export default class Routes {
  constructor(downloadsFolder = defaultDownloadsFolder) {
    this.downloadsFolder = downloadsFolder;
    this.filehelper = FileHelper;
    this.io = {}
  }

  setSocketInstance(io) {
    this.io = io;
  }

  async get(request, response) {
    const files = await this.filehelper.getFileStatus(
      this.downloadsFolder
    );
    response.writeHead(200);
    response.end(JSON.stringify(files));
  }

  async post(request, response) {
    const { headers } = request;

    const {
      query: { socketId },
    } = parse(request.url, true);

    const uploadHandler = new UploadHandler({
      socketId,
      io: this.io,
      downloadsFolder: this.downloadsFolder,
    });

    const onFinish = (response) => () => {
      response.writeHead(200);
      const data = JSON.stringify({ result: "Files uploaded with succes!" });
      response.end(data);
    };

    const busboyInstance = uploadHandler.registerEvents(
      headers,
      onFinish(response)
    );

    await pipeline(request, busboyInstance);

    logger.info("Request finish with success!!");
  }

  async options(request, response) {
    response.writeHead(204);
    response.end();
  }

  async defaultRoute(request, response) {
    response.end("Hello world");
  }

  handler(request, response) {
    // response.setHeader("Acess-Control-Allow-Origin", "*");
    response.setHeader('access-control-allow-origin', '*')
    response.setHeader('access-control-allow-methods', '*')
    response.setHeader('access-control-allow-headers', '*')
    const chosen = this[request.method.toLowerCase()] || this.defaultRoute;
    return chosen.apply(this, [request, response]);
  }
}
