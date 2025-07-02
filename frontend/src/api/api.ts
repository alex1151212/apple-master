/* eslint-disable @typescript-eslint/naming-convention */
import { Method as M } from "axios";

const Method = {
  POST: "POST" as M,
  GET: "GET" as M,
  PUT: "PUT" as M,
  PATCH: "PATCH" as M,
  DELETE: "DELETE" as M,
};

//對應後端 swagger 分類
export const api = {
  getRoomList: {
    url: () => `/rooms`,
    method: Method.GET,
  },
};
