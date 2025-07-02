/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { lowerFirst, upperFirst } from "lodash";

export const formatTime = (timestamp: number) => {
  let timestampSec;
  if (typeof timestamp === "string") timestampSec = timestamp;
  else timestampSec = Math.floor(timestamp / 1000000);
  dayjs.extend(utc);
  const formattedTimezone = `(GMT+${String(
    Number(dayjs(timestampSec).format("Z").split(":")[0])
  )})`;
  return `${dayjs(timestampSec).format(
    "YYYY/MM/DD HH:mm:ss "
  )} ${formattedTimezone}`;
};

// 加千分位
export function toCurrency(num: number | string) {
  const CURRENCY_RATE = 10000;
  // eslint-disable-next-line prefer-const
  let [integer, decimal] =
    typeof num === "number"
      ? (num / CURRENCY_RATE).toString().split(".")
      : [String(parseFloat(num.split(".")[0]) / 10000), num.split(".")[1]];
  integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${integer}${decimal ? `.${decimal}` : ""}`;
}

export const pascalCaseKeys = (object: any) => {
  return Object.entries(object).reduce((carry: any, [key, value]) => {
    if (typeof value === "object" && !Array.isArray(value)) {
      carry[upperFirst(key)] = pascalCaseKeys(value);
    } else {
      carry[upperFirst(key)] = value;
    }
    return carry;
  }, {});
};
const gameIDRegex = /^(PK|SB|SL|CR|FS)\d{4}$/; // 若前兩碼為PK,SB,SL後面接四位數字，則視為遊戲ID

export const camelCaseKeys = (object: any): any => {
  if (Array.isArray(object)) {
    return object.map((v) => camelCaseKeys(v));
  } else if (object && object !== null && object.constructor === Object) {
    return Object.keys(object).reduce((result, key) => {
      if (key === "Channels" || key === "Permissions") {
        return {
          ...result,
          [lowerFirst(key)]: object[key],
        };
      } else if (
        key === "ID" ||
        key === "RTP" ||
        key === "PL" ||
        gameIDRegex.test(key)
      ) {
        return {
          ...result,
          [key]: camelCaseKeys(object[key]),
        };
      } else {
        return {
          ...result,
          [lowerFirst(key)]: camelCaseKeys(object[key]),
        };
      }
    }, {});
  }
  return object;
};

export const getQueryStringValue = (key: string): string | null => {
  return new URLSearchParams(window.location.search).get(key);
};
