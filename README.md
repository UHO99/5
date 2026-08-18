# HighFive
[LG U+] 유레카 SW 백엔드 과정 종합 프로젝트 — 선착 쿠폰 발급 시스템

## 개인정보 마스킹 (S008)

로그·응답에서 이메일 / 전화번호 / 이름을 마스킹한다. DB·Entity는 원문 유지.

- 유틸: `global.common.util.MaskingUtils`
- 로그: `global.aspect.LoggingAspect`
- 응답: `domain.user.dto.UserResponse.from(User)`

| 원문 | 마스킹 |
| --- | --- |
| `hong@example.com` | `h***@example.com` |
| `010-1234-5678` | `010-****-5678` |
| `홍길동` | `홍**` |


