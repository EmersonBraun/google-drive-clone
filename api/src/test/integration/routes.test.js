import { describe, test, expect, jest } from "@jest/globals";
import FormData from "form-data";
import Routes from "../../routes";
import fs from "fs";
import TestUtil from "../_util/testUtil";
import { logger } from "../../logger";
import { tmpdir } from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
describe("#Routes integrations suite", () => {
  let defaultDownloadsFolder = "";
  beforeAll(async () => {
    defaultDownloadsFolder = await fs.promises.mkdtemp(
      join(tmpdir(), "downloads-")
    );
  });

  afterAll(async () => {
    await fs.promises.rm(defaultDownloadsFolder, { recursive: true });
  });

  beforeEach(() => {
    jest.spyOn(logger, "info").mockImplementation();
  });

  describe("#getFileStatus", () => {
    const ioObj = {
      to: (id) => ioObj,
      emit: (event, message) => {},
    };
    test("should upload file to the folder", async () => {
      const filename = "file.txt";
      const fileSteam = fs.createReadStream(`${__dirname}/mocks/${filename}`);
      const response = TestUtil.generateWritableStream(() => {});

      const form = new FormData();
      form.append("photo", fileSteam);

      const defaultParams = {
        request: Object.assign(form, {
          headers: form.getHeaders(),
          method: "POST",
          url: "?socketId=10",
        }),
        response: Object.assign(response, {
          setHeader: jest.fn(),
          writeHead: jest.fn(),
          end: jest.fn(),
        }),
        values: () => Object.values(defaultParams),
      };

      const routes = new Routes(defaultDownloadsFolder);
      routes.setSocketInstance(ioObj);
      const dirBeforeRan = await fs.promises.readdir(defaultDownloadsFolder);
      expect(dirBeforeRan).toEqual([]);

      await routes.handler(...defaultParams.values());
      const dirAfterRan = await fs.promises.readdir(defaultDownloadsFolder);
      expect(dirAfterRan).toEqual([filename]);

      expect(defaultParams.response.writeHead).toHaveBeenCalledWith(200)
      const expectedResult = JSON.stringify({ result: "Files uploaded with succes!" });
      expect(defaultParams.response.end).toHaveBeenCalledWith(expectedResult)
    });
  });
});
