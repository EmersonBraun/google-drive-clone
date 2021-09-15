import { describe, test, expect, jest } from "@jest/globals";
import UploadHandler from "../../uploadHandler";
import TestUtil from "../_util/testUtil";
import fs from "fs";
import { pipeline } from "stream/promises";
import { resolve } from "path";
import { logger } from "../../logger";

describe("#UploadHandler test suite", () => {
  const ioObj = {
    to: (id) => ioObj,
    emit: (event, message) => {},
  };

  beforeEach(() => {
    jest.spyOn(logger, "info").mockImplementation();
  });

  describe("#registerEvents", () => {
    test("Should call onFile and onFinish functions on Busboy instance", () => {
      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: "01",
      });

      jest.spyOn(uploadHandler, uploadHandler.onFile.name).mockResolvedValue();

      const headers = {
        "content-type": "multipart/form-data; boundary=",
      };
      const onFinish = jest.fn();
      const busboyInstance = uploadHandler.registerEvents(headers, onFinish);

      const fileSteam = TestUtil.generateReadableSteam(["chunk", "of", "data"]);
      busboyInstance.emit("file", "fieldname", fileSteam, "filename.txt");
      busboyInstance.listeners("finish")[0].call();
      expect(uploadHandler.onFile).toHaveBeenCalled();
      expect(onFinish).toHaveBeenCalled();
    });
  });

  describe("#onFile", () => {
    test("given a stream file it should save it on disk", async () => {
      const chunks = ["hey", "dude"];
      const downloadsFolder = "/tmp";
      const handler = new UploadHandler({
        io: ioObj,
        socketId: "01",
        downloadsFolder,
      });
      const onData = jest.fn();
      jest
        .spyOn(fs, fs.createWriteStream.name)
        .mockImplementation(() => TestUtil.generateWritableStream(onData));

      const onTransform = jest.fn();
      jest
        .spyOn(handler, handler.handleFileBytes.name)
        .mockImplementation(() =>
          TestUtil.generateTransformStream(onTransform)
        );

      const params = {
        fieldname: "video",
        file: TestUtil.generateReadableSteam(chunks),
        filename: "test.mov",
      };

      await handler.onFile(...Object.values(params));

      expect(onData.mock.calls.join()).toEqual(chunks.join());
      expect(onTransform.mock.calls.join()).toEqual(chunks.join());

      const expectedFilename = resolve(
        handler.downloadsFolder,
        params.filename
      );
      expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFilename);
    });
  });

  describe("#handleFileBytes", () => {
    test("should call emit function and it is a transform stream", async () => {
      jest.spyOn(ioObj, ioObj.to.name);
      jest.spyOn(ioObj, ioObj.emit.name);

      const handler = new UploadHandler({
        io: ioObj,
        socketId: "01",
      });
      jest.spyOn(handler, handler.canExecute.name).mockReturnValue(true);

      const messages = ["hello", "world"];
      const source = TestUtil.generateReadableSteam(messages);
      const onWrite = jest.fn();
      const target = TestUtil.generateWritableStream(onWrite);

      await pipeline(source, handler.handleFileBytes("filename.txt"), target);

      expect(ioObj.to).toHaveBeenCalledTimes(messages.length);
      expect(ioObj.emit).toHaveBeenCalledTimes(messages.length);
      expect(onWrite.mock.calls.join()).toEqual(messages.join());
    });
  });

  describe("#canExecute", () => {
    test("should return true when time is later than specified delay", () => {
      const timerDelay = 1000;
      const uploadHandler = new UploadHandler({
        io: {},
        socketId: "",
        messageTimeDelay: timerDelay,
      });

      const tickNow = TestUtil.getTimeFromDate("2021-07-01 00:00:03");
      TestUtil.mockDateNow([tickNow]);

      const lastExecution = TestUtil.getTimeFromDate(
        "2021-07-01 00:00:00"
      );
      const result = uploadHandler.canExecute(lastExecution);
      expect(result).toBeTruthy();
    });
    test("should return false when time isnt later than specified delay", () => {
      const timerDelay = 2000;
      const uploadHandler = new UploadHandler({
        io: {},
        socketId: "",
        messageTimeDelay: timerDelay,
      });

      const tickNow = TestUtil.getTimeFromDate("2021-07-01 00:00:01");
      TestUtil.mockDateNow([tickNow]);

      const lastExecution = TestUtil.getTimeFromDate(
        "2021-07-01 00:00:00"
      );
      const result = uploadHandler.canExecute(lastExecution);
      expect(result).toBeFalsy();
    });
    test('given message timerDelay as 2sec it should emit only two messages during 2 seconds period', async () => {
      jest.spyOn(ioObj, ioObj.emit.name);
      const messageTimeDelay = 2000

      const day = '2021-07-01 01:01'
      const onFirstLastMessageSent = TestUtil.getTimeFromDate(`${day}:00`)
      const onFirstCanExecute = TestUtil.getTimeFromDate(`${day}:02`)
      const onSecondUpdateLastMessageSent = onFirstCanExecute
      const onSecondCanExecute = TestUtil.getTimeFromDate(`${day}:03`)
      const onThirdCanExecute = TestUtil.getTimeFromDate(`${day}:04`)

      TestUtil.mockDateNow([
        onFirstLastMessageSent,
        onFirstCanExecute,
        onSecondUpdateLastMessageSent,
        onSecondCanExecute,
        onThirdCanExecute
      ])
      const handler = new UploadHandler({
        io: ioObj,
        socketId: "01",
        messageTimeDelay
      });

      const messages = ['hello', 'hello', 'world']
      const expectedMessageSent = 2
      const filename = 'filename.txt'
      const source = TestUtil.generateReadableSteam(messages)

      await pipeline(
        source,
        handler.handleFileBytes(filename)
      )
      expect(ioObj.emit).toBeCalledTimes(expectedMessageSent)
      const [fistCallResult, secondCallResult] = ioObj.emit.mock.calls
    
      expect(fistCallResult).toEqual([handler.ON_UPLOAD_EVENT, { processedAlready: 'hello'.length, filename }])
      expect(secondCallResult).toEqual([handler.ON_UPLOAD_EVENT, { processedAlready: messages.join('').length, filename }])
    });
  });
});
