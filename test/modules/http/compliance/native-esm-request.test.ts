// @vitest-environment node
import { createRequire } from 'node:module'
import type http from 'node:http'
import type https from 'node:https'
import { ClientRequestInterceptor } from '#/src/interceptors/ClientRequest'
import { toWebResponse } from '#/test/helpers'

interface NativeEsmRequestFixture {
  requestHttp: (url: string) => http.ClientRequest
  requestHttps: (url: string) => http.ClientRequest
  getHttpRequest: () => typeof http.request
  getHttpsRequest: () => typeof https.request
}

/** Load this fixture through Node so Vitest cannot transform its ESM imports. */
function loadFixture(): NativeEsmRequestFixture {
  const require = createRequire(import.meta.url)
  return require('./fixtures/native-esm-request.mjs')
}

const fixture = loadFixture()
const nativeHttpRequest = fixture.getHttpRequest()
const nativeHttpsRequest = fixture.getHttpsRequest()
let interceptor: ClientRequestInterceptor

beforeEach(() => {
  interceptor = new ClientRequestInterceptor()
  interceptor.apply()
})

afterEach(() => {
  interceptor.removeAllListeners()
  interceptor.dispose()

  expect(fixture.getHttpRequest()).toBe(nativeHttpRequest)
  expect(fixture.getHttpsRequest()).toBe(nativeHttpsRequest)
})

it.each([
  ['http', fixture.requestHttp, 'http://non-existing.example/resource'],
  ['https', fixture.requestHttps, 'https://non-existing.example/resource'],
])(
  'intercepts a %s request made via a native ESM binding',
  async (_, request, url) => {
    interceptor.on('request', ({ controller }) => {
      controller.respondWith(new Response('mocked'))
    })

    const clientRequest = request(url)
    const [response] = await toWebResponse(clientRequest)

    expect(response.status).toBe(200)
    await expect(response.text()).resolves.toBe('mocked')
  }
)
