import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'

export function requestHttp(url) {
  return httpRequest(url).end()
}

export function requestHttps(url) {
  return httpsRequest(url).end()
}

export function getHttpRequest() {
  return httpRequest
}

export function getHttpsRequest() {
  return httpsRequest
}
