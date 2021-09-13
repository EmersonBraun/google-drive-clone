import { describe, test, expect, jest } from "@jest/globals";
import Routes from "../../routes";
import fs from 'fs'
import FileHelper from "../../fileHelper";

describe("#fileHelper test suite", () => {
  describe("#getFileStatus", () => {
    test("it should return files statuses in correct format", async () => {
      const statMock = {
        dev: 2052,
        mode: 33204,
        nlink: 1,
        uid: 1000,
        gid: 1000,
        rdev: 0,
        blksize: 4096,
        ino: 17173550,
        size: 67298,
        blocks: 136,
        atimeMs: 1631235981626.3765,
        mtimeMs: 1631235981498.3774,
        ctimeMs: 1631235981498.3774,
        birthtimeMs: 1631235981498.3774,
        atime: "2021-09-10T01:06:21.626Z",
        mtime: "2021-09-10T01:06:21.498Z",
        ctime: "2021-09-10T01:06:21.498Z",
        birthtime: "2021-09-10T01:06:21.498Z",
      };

      const mockUser = 'braun'
      process.env.USER = mockUser
      const fileName = "file.png"

      jest.spyOn(fs.promises, fs.promises.stat.name)
        .mockResolvedValue(statMock)

      jest.spyOn(fs.promises, fs.promises.readdir.name)
        .mockResolvedValue([fileName])

      const result = await FileHelper.getFileStatus("/tmp")
      const expectedResult = [
        {
          size: "67.3 kB",
          lastModified: statMock.birthtime,
          owner: mockUser,
          file: fileName,
        },
      ];

      expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${fileName}`)
      expect(result).toMatchObject(expectedResult)
    });
  });
});
