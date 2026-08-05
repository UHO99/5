// Toss 결제위젯이 successUrl/failUrl로 리다이렉트할 때 orderId/paymentKey/amount 같은
// 파라미터를 해시(#) 앞의 진짜 쿼리스트링과 해시 뒤(`#/user/payment/success&paymentType=...`)
// 중 어디에 붙일지가 항상 일정하지 않다. 해시라우터는 `#` 뒤 문자열에 `?`가 없으면 전체를
// pathname으로 취급해 라우트 매칭에 실패하고, PaymentSuccessPage는 location.search만 읽으므로
// 해시 뒤에 붙은 파라미터는 그대로 두면 유실된다 - 예전엔 hash suffix를 통째로 버려서
// orderId/paymentKey/amount까지 같이 사라지는 바람에 결제 승인 요청이 아예 안 나가는 문제가 있었다.
// 그래서 해시 앞/뒤 파라미터를 모두 모아 실제 쿼리스트링 쪽으로 합쳐준다.
// 라우터(createHashRouter)가 최초 위치를 읽기 전에 정리해야 하므로, 이 모듈은
// main.tsx에서 App(및 routes.ts)보다 먼저 import되어야 한다.
const hashMatch = window.location.hash.match(/^#(\/user\/payment\/(?:success|fail))(?:[&?](.*))?$/)

if (hashMatch) {
  const [, path, hashParams] = hashMatch
  const mergedParams = new URLSearchParams(window.location.search)

  if (hashParams) {
    new URLSearchParams(hashParams).forEach((value, key) => mergedParams.set(key, value))
  }

  const query = mergedParams.toString()
  const newUrl = `${window.location.pathname}${query ? `?${query}` : ''}#${path}`
  window.history.replaceState(null, '', newUrl)
}
