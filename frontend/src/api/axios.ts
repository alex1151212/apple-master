/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosResponse, Canceler } from "axios";
import { camelCaseKeys, pascalCaseKeys } from "@/utils/helper";
let requestQueue: Canceler[] = [];

export const clearRequest = () => {
  requestQueue.forEach((cancelRequest) => {
    cancelRequest();
  });
  requestQueue = [];
};

const instance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_URL,
  timeout: 60 * 1000 * 60,
  headers: {
    "Content-Type": "application/json", // 添加 Content-Type 头部
  },
});

instance.interceptors.request.use(
  (config) => {
    if (config.params) {
      // 如果需要轉大寫再用下面這行
      config.params = pascalCaseKeys(config.params);
      config.cancelToken = new axios.CancelToken((c) => {
        requestQueue.push(() => c(`Canceled request ${config.url}`));
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
instance.interceptors.response.use(
  (response: AxiosResponse<any>) => {
    if (response.data) {
      response.data = camelCaseKeys(response.data);
    }
    return response;
  },
  (error) => {
    const message = "";
    console.log(error, error.response);
    if (error && error.message && error.message === "Network Error") {
      console.log("Network Error");
    } else if (error.response && error.response.status === 401) {
      console.log("401");
    } else if (
      error &&
      error.response &&
      error.response.data &&
      error.response.data["ErrorCode"]
    ) {
      const errorCode = error.response.data["ErrorCode"];
      console.log("error code", errorCode);
    }
    return Promise.reject({
      ...error,
      message: { text: message, type: "error" },
    });
  }
);

export { instance };
