import * as https from "https";
import * as qs from "querystring";
import { IncomingMessage, OutgoingHttpHeaders, RequestOptions } from "http";

type RequestParams = { [key: string]: number | string };

type HTTP_METHOD = "GET" | "PUT" | "POST" | "PATCH" | "DELETE";

export class HTTPResponse {
  private _response: IncomingMessage;
  private _headers: OutgoingHttpHeaders;
  private _statusCode: number;

  constructor(response: IncomingMessage) {
    this._response = response;
    this._headers = response.headers;
    this._statusCode = response.statusCode;
  }

  get headers(): OutgoingHttpHeaders {
    return this._headers;
  }

  get statusCode(): number {
    return this._statusCode;
  }

  async data(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      let data = Buffer.from("");
      this._response
        .on("data", (chunk) => (data = Buffer.concat([data, chunk])))
        .on("error", (error) => reject(error))
        .on("end", () => resolve(data));
    });
  }

  async text(): Promise<string> {
    const buffer = await this.data();
    return buffer.toString();
  }

  async json<T>(): Promise<T> {
    const isJson = this.headers["content-type"] === "application/json";
    if (isJson) {
      return JSON.parse(await this.text()) as T;
    }
  }
}

class HTTPClient {
  async request(
    url: string,
    method: HTTP_METHOD,
    params?: RequestParams,
    body?: any,
    options?: RequestOptions
  ): Promise<HTTPResponse> {
    return new Promise<HTTPResponse>((resolve, reject) => {
      const urlObject = new URL(`${url}?${qs.stringify(params)}`);
      const request = https.request(
        urlObject,
        {
          method,
          ...options,
        },
        (response) => {
          const result = new HTTPResponse(response);
          if (response.statusCode >= 400) {
            reject(result);
          } else {
            resolve(result);
          }
        }
      );

      request.on("error", (error) => reject(error));
      if (!!body) {
        const data = new TextEncoder().encode(JSON.stringify(body));
        request.write(data);
      }
      request.end();
    });
  }

  async get(
    url: string,
    params?: RequestParams,
    options?: RequestOptions
  ): Promise<HTTPResponse> {
    return this.request(url, "GET", params, undefined, options);
  }

  async post(
    url: string,
    params?: RequestParams,
    body?: any,
    options?: RequestOptions
  ): Promise<HTTPResponse> {
    return this.request(url, "POST", params, body, options);
  }

  async put(
    url: string,
    params?: RequestParams,
    body?: any,
    options?: RequestOptions
  ): Promise<HTTPResponse> {
    return this.request(url, "PUT", params, body, options);
  }

  async patch(
    url: string,
    params?: RequestParams,
    body?: any,
    options?: RequestOptions
  ): Promise<HTTPResponse> {
    return this.request(url, "PATCH", params, body, options);
  }

  async delete(
    url: string,
    params?: RequestParams,
    body?: any,
    options?: RequestOptions
  ): Promise<HTTPResponse> {
    return this.request(url, "DELETE", params, body, options);
  }
}

(async function () {
  const c = new HTTPClient();
  const resp = await c.get("https://google.vn");
  const data = await resp.text();
  console.log(data);
})();
