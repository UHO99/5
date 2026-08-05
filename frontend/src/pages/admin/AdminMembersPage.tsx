import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import * as membersApi from '../../lib/api/members'
import { ApiError } from '../../lib/api/client'
import type { MemberResponse } from '../../lib/api/types'
import { GRADE_CONFIG, type Grade } from '../../context/AuthContext'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

const GRADE_KEY: Record<MemberResponse['grade'], Grade> = {
  BRONZE: 'bronze', SILVER: 'silver', GOLD: 'gold', VIP: 'vip',
}

const PAGE_SIZE = 20

export default function AdminMembersPage() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<MemberResponse[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [search, setSearch] = useState('')

  const load = useCallback(async (pageNumber: number) => {
    setLoading(true)
    try {
      const result = await membersApi.adminListMembers(pageNumber, PAGE_SIZE)
      setMembers(result.content)
      setTotalPages(result.totalPages)
      setTotalElements(result.totalElements)
    } catch {
      showToast('회원 목록을 불러오지 못했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { load(page) }, [load, page])

  // 검색은 서버 조회 없이, 지금 불러온 페이지 안에서만 걸러낸다
  const filtered = members.filter((m) =>
    !search || m.username.includes(search) || m.name.includes(search) || m.email.includes(search),
  )

  const handleWithdraw = async (member: MemberResponse) => {
    if (!window.confirm(`${member.name}(${member.username}) 회원을 강제 탈퇴시키겠습니까?`)) return
    try {
      await membersApi.adminWithdrawMember(member.id)
      setMembers((prev) => prev.filter((m) => m.id !== member.id))
      showToast('탈퇴 처리되었습니다.', 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : '탈퇴 처리에 실패했습니다.', 'error')
    }
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900" style={{ letterSpacing: '-0.02em' }}>회원 관리</h1>
          <p className="text-sm text-gray-500 mt-1">전체 {totalElements}명</p>
        </div>

        {/* 검색 */}
        <div className="rounded-2xl p-4 mb-5" style={{ background: '#fff', border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="relative max-w-xs">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <input type="text" placeholder="아이디, 이름, 이메일 검색" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none"
              style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }} />
          </div>
        </div>

        {/* 테이블 */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e8edf5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e8edf5' }}>
                  {['ID', '아이디', '이름', '이메일', '권한', '등급', '관리'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-16 text-sm text-gray-400">회원이 없습니다</td></tr>
                ) : (
                  filtered.map((m, i) => {
                    const grade = GRADE_CONFIG[GRADE_KEY[m.grade]]
                    return (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors"
                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <td className="px-5 py-4 text-xs font-mono font-semibold text-gray-500">#{m.id}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">{m.username}</td>
                        <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">{m.name}</td>
                        <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">{m.email}</td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap" style={{ background: '#f8fafc', color: '#6b7280' }}>
                            일반회원
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap" style={{ background: grade.bg, color: grade.color }}>
                            {grade.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button onClick={() => handleWithdraw(m)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap"
                            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                            강제 탈퇴
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3" style={{ background: '#f8fafc', borderTop: '1px solid #e8edf5' }}>
            <span className="text-xs text-gray-400">이 페이지 {filtered.length}명 (전체 {totalElements}명)</span>
          </div>
        </div>

        {/* 페이지네이션 (백엔드 기본 size=20 기준) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-5">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ border: '1px solid #e2e8f0', color: '#475569' }}>
              이전
            </button>
            <span className="text-xs text-gray-500 px-2">
              {page + 1} / {totalPages} 페이지
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ border: '1px solid #e2e8f0', color: '#475569' }}>
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
