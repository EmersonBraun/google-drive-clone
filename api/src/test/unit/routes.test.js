import { describe, test, expect, jest } from "@jest/globals";
import Routes from "../../routes";

describe("#Routes test suite", () => {
  const defaultParams = {
    request: {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      method: "",
      body: {},
    },
    response: {
      setHeader: jest.fn(),
      writeHead: jest.fn(),
      end: jest.fn(),
    },
    values: () => Object.values(defaultParams),
  };
  describe("#setSocketInstance", () => {
    test("setScoket should store io instance", () => {
      const routes = new Routes();
      const ioObj = {
        to: (id) => ioObj,
        emit: (event, message) => {},
      };

      routes.setSocketInstance(ioObj);
      expect(routes.io).toStrictEqual(ioObj);
    });
  });
  describe("#handler", () => {
    test("given an inexistent route ir should return defaultRoute", async () => {
      const routes = new Routes();
      const params = { ...defaultParams };
      params.request.method = "inexistent";
      await routes.handler(...params.values());
      expect(params.response.end).toHaveBeenCalledWith("Hello world");
    });
    test("it should set any request with CORS enabled", async () => {
      const routes = new Routes();
      const params = { ...defaultParams };
      params.request.method = "inexistent";
      await routes.handler(...params.values());
      expect(params.response.setHeader).toHaveBeenCalledWith(
        "Acess-Control-Allow-Origin",
        "*"
      );
    });
    test("given method OPTION it should chose options route", async () => {
      const routes = new Routes();
      const params = { ...defaultParams };
      params.request.method = "OPTIONS";
      await routes.handler(...params.values());
      expect(params.response.writeHead).toHaveBeenCalledWith(204);
      expect(params.response.end).toHaveBeenCalled();
    });
    test("given method POST it should chose post route", async () => {
      const routes = new Routes();
      const params = { ...defaultParams };
      params.request.method = "POST";
      jest.spyOn(routes, routes.post.name).mockResolvedValue();
      await routes.handler(...params.values());
      expect(routes.post).toHaveBeenCalled();
    });
    test("given method GET it should chose get route", async () => {
      const routes = new Routes();
      const params = { ...defaultParams };
      params.request.method = "GET";
      jest.spyOn(routes, routes.get.name).mockResolvedValue();
      await routes.handler(...params.values());
      expect(routes.get).toHaveBeenCalled();
    });
  });
  describe("#get", () => {
    test("given method GET it should list all files dowloaded", async () => {
      const routes = new Routes();
      const params = { ...defaultParams };
      const filesStatusesMock = [
        {
          size: "67.3 kB",
          lastModified: "2021-09-10T01:06:21.498Z",
          owner: "braun",
          file: "file.png",
        },
      ];

      jest.spyOn(routes.filehelper, routes.filehelper.getFileStatus.name).mockResolvedValue(filesStatusesMock)
      params.request.method = 'GET'

      await routes.handler(...params.values());
      expect(params.response.writeHead).toHaveBeenCalledWith(200);
      expect(params.response.end).toHaveBeenCalledWith(JSON.stringify(filesStatusesMock));
    });
  });
});
