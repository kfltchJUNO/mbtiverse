"use client";

import { useState, useEffect } from "react";
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, updateDoc, query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";

// ─────────────────────────────────────────────
// JSON 스키마 예시 (관리자 가이드용)
// ─────────────────────────────────────────────
const JSON_SCHEMA_EXAMPLE = `{
  "title": "나는 어떤 계절 인간일까?",
  "description": "4가지 선택으로 알아보는 나의 계절 유형",
  "slug": "season-type",
  "questions": [
    {
      "id": 1,
      "text": "주말 오전에 나는?",
      "options": [
        { "text": "창문 열고 이불 개기", "value": "S" },
        { "text": "커튼 치고 늦잠", "value": "W" },
        { "text": "가볍게 산책 나가기", "value": "SP" },
        { "text": "카페 가서 책 읽기", "value": "A" }
      ]
    }
  ],
  "results": [
    {
      "id": "S",
      "name": "따사로운 여름 인간",
      "description": "에너지가 넘치고 활동적인 당신!",
      "mbti": "ESFP",
      "imageUrl": ""
    }
  ]
}`;

type Tab = "create" | "manage";

export default function TestBuilderPage() {
  const [tab, setTab] = useState<Tab>("create");

  // ── 생성 탭 상태 ──
  const [jsonInput, setJsonInput] = useState("");
  const [parseError, setParseError] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── 관리 탭 상태 ──
  const [tests, setTests] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);

  // ── 결과 이미지 편집 ──
  const [editingTest, setEditingTest] = useState<any>(null);
  const [resultImages, setResultImages] = useState<Record<string, string>>({});
  const [isSavingImages, setIsSavingImages] = useState(false);

  useEffect(() => {
    if (tab === "manage") fetchTests();
  }, [tab]);

  const fetchTests = async () => {
    setLoadingTests(true);
    const q = query(collection(db, "custom_tests"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setTests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoadingTests(false);
  };

  // JSON 파싱 및 유효성 검사
  const handleParse = () => {
    setParseError("");
    setParsed(null);
    try {
      const data = JSON.parse(jsonInput);

      // 필수 필드 검사
      if (!data.title) throw new Error("title 필드가 없습니다.");
      if (!data.slug) throw new Error("slug 필드가 없습니다. (URL 경로에 사용)");
      if (!Array.isArray(data.questions) || data.questions.length === 0)
        throw new Error("questions 배열이 비어있습니다.");
      if (!Array.isArray(data.results) || data.results.length === 0)
        throw new Error("results 배열이 비어있습니다.");

      // 각 질문 검사
      data.questions.forEach((q: any, i: number) => {
        if (!q.text) throw new Error(`questions[${i}].text가 없습니다.`);
        if (!Array.isArray(q.options) || q.options.length < 2)
          throw new Error(`questions[${i}].options가 2개 이상이어야 합니다.`);
      });

      // 각 결과 검사
      data.results.forEach((r: any, i: number) => {
        if (!r.id) throw new Error(`results[${i}].id가 없습니다.`);
        if (!r.name) throw new Error(`results[${i}].name이 없습니다.`);
      });

      setParsed(data);
    } catch (err: any) {
      setParseError(err.message);
    }
  };

  const handlePublish = async () => {
    if (!parsed) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, "custom_tests"), {
        ...parsed,
        createdAt: serverTimestamp(),
        isActive: true,
      });
      alert(`✅ "${parsed.title}" 테스트가 발행되었습니다!\n경로: /test/${parsed.slug}`);
      setJsonInput("");
      setParsed(null);
    } catch {
      alert("발행 중 오류가 발생했습니다.");
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 테스트를 삭제하시겠습니까?`)) return;
    try {
      await deleteDoc(doc(db, "custom_tests", id));
      fetchTests();
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 결과 이미지 편집 열기
  const openImageEditor = (test: any) => {
    setEditingTest(test);
    const imgMap: Record<string, string> = {};
    (test.results || []).forEach((r: any) => {
      imgMap[r.id] = r.imageUrl || "";
    });
    setResultImages(imgMap);
  };

  // 결과 이미지 일괄 저장
  const handleSaveImages = async () => {
    if (!editingTest) return;
    setIsSavingImages(true);
    try {
      const updatedResults = editingTest.results.map((r: any) => ({
        ...r,
        imageUrl: resultImages[r.id] || "",
      }));
      await updateDoc(doc(db, "custom_tests", editingTest.id), {
        results: updatedResults,
        updatedAt: serverTimestamp(),
      });
      alert("✅ 결과 이미지가 저장되었습니다.");
      setEditingTest(null);
      fetchTests();
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    }
    setIsSavingImages(false);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-slate-100">테스트 빌더</h2>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 p-1 bg-slate-900 rounded-xl w-max border border-slate-700 mb-8">
        <button
          onClick={() => setTab("create")}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === "create" ? "bg-indigo-600 text-white" : "text-slate-400"
          }`}
        >
          ➕ JSON으로 테스트 생성
        </button>
        <button
          onClick={() => setTab("manage")}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === "manage" ? "bg-emerald-600 text-white" : "text-slate-400"
          }`}
        >
          📋 테스트 목록 관리
        </button>
      </div>

      {/* ── 생성 탭 ── */}
      {tab === "create" && (
        <div className="space-y-6">
          {/* JSON 스키마 가이드 */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-300 text-sm">📋 JSON 스키마 가이드</h3>
              <button
                onClick={() => setJsonInput(JSON_SCHEMA_EXAMPLE)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-bold transition"
              >
                예시 불러오기
              </button>
            </div>
            <pre className="text-xs text-slate-400 bg-slate-900 rounded-xl p-4 overflow-x-auto leading-relaxed max-h-48 overflow-y-auto">
              {JSON_SCHEMA_EXAMPLE}
            </pre>
          </div>

          {/* JSON 입력 */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
            <h3 className="font-bold text-slate-300 text-sm mb-3">📝 JSON 입력</h3>
            <textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setParseError("");
                setParsed(null);
              }}
              placeholder="위 스키마 형식에 맞게 JSON을 입력하세요..."
              className="w-full h-64 p-4 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl text-xs font-mono resize-none focus:outline-none focus:border-indigo-500"
            />

            {parseError && (
              <div className="mt-2 p-3 bg-red-900/40 border border-red-700 rounded-xl text-red-400 text-xs">
                ❌ {parseError}
              </div>
            )}

            <button
              onClick={handleParse}
              disabled={!jsonInput.trim()}
              className="mt-3 px-6 py-2.5 bg-slate-600 hover:bg-slate-500 text-white rounded-xl font-bold text-sm transition disabled:opacity-40"
            >
              유효성 검사
            </button>
          </div>

          {/* 파싱 성공 미리보기 */}
          {parsed && (
            <div className="bg-slate-800 rounded-2xl border border-emerald-700/50 p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-emerald-400 font-black">✅ 유효한 JSON</span>
              </div>

              <div className="space-y-2 text-sm mb-5">
                <div className="flex gap-3">
                  <span className="text-slate-500 w-24 flex-shrink-0">제목</span>
                  <span className="text-slate-100 font-bold">{parsed.title}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-slate-500 w-24 flex-shrink-0">경로</span>
                  <span className="text-indigo-400 font-mono">/test/{parsed.slug}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-slate-500 w-24 flex-shrink-0">질문 수</span>
                  <span className="text-slate-100">{parsed.questions.length}개</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-slate-500 w-24 flex-shrink-0">결과 수</span>
                  <span className="text-slate-100">{parsed.results.length}개</span>
                </div>
                {parsed.description && (
                  <div className="flex gap-3">
                    <span className="text-slate-500 w-24 flex-shrink-0">설명</span>
                    <span className="text-slate-300">{parsed.description}</span>
                  </div>
                )}
              </div>

              {/* 결과 목록 미리보기 */}
              <div className="bg-slate-900 rounded-xl p-4 mb-5">
                <p className="text-slate-400 text-xs font-bold mb-2">결과 유형 미리보기</p>
                <div className="grid grid-cols-2 gap-2">
                  {parsed.results.map((r: any) => (
                    <div key={r.id} className="flex items-center gap-2 bg-slate-800 rounded-lg p-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-900 text-indigo-300 flex items-center justify-center text-[10px] font-black flex-shrink-0">
                        {r.id}
                      </span>
                      <div>
                        <p className="text-slate-200 text-xs font-bold">{r.name}</p>
                        {r.mbti && <p className="text-slate-500 text-[10px]">{r.mbti}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handlePublish}
                disabled={isSaving}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition disabled:opacity-40"
              >
                {isSaving ? "발행 중..." : `🚀 "${parsed.title}" 발행하기`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 관리 탭 ── */}
      {tab === "manage" && (
        <div>
          {loadingTests ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-20 text-slate-500 bg-slate-800 rounded-2xl border border-slate-700">
              생성된 테스트가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {tests.map(test => (
                <div key={test.id} className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-slate-100">{test.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          test.isActive
                            ? "bg-emerald-900 text-emerald-400"
                            : "bg-slate-700 text-slate-500"
                        }`}>
                          {test.isActive ? "✓ 활성" : "비활성"}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mb-1">{test.description}</p>
                      <div className="flex gap-3 text-xs text-slate-500">
                        <span>경로: <span className="text-indigo-400 font-mono">/test/{test.slug}</span></span>
                        <span>질문 {test.questions?.length || 0}개</span>
                        <span>결과 {test.results?.length || 0}개</span>
                        <span>
                          이미지 {(test.results || []).filter((r: any) => r.imageUrl).length}/
                          {(test.results || []).length}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => openImageEditor(test)}
                        className="px-3 py-1.5 bg-amber-900 hover:bg-amber-800 text-amber-300 rounded-lg text-xs font-bold transition border border-amber-800"
                      >
                        🖼️ 결과 이미지
                      </button>
                      <button
                        onClick={() => handleDelete(test.id, test.title)}
                        className="px-3 py-1.5 bg-red-900 hover:bg-red-800 text-red-400 rounded-lg text-xs font-bold transition border border-red-800"
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  </div>

                  {/* 결과 이미지 편집 인라인 패널 */}
                  {editingTest?.id === test.id && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <h4 className="font-bold text-slate-300 text-sm mb-3">
                        🖼️ 결과 유형별 이미지 설정
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {editingTest.results.map((r: any) => (
                          <div key={r.id} className="bg-slate-900 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                              {resultImages[r.id] ? (
                                <img
                                  src={resultImages[r.id]}
                                  alt={r.name}
                                  className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                                  onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-slate-700 border border-dashed border-slate-600 flex items-center justify-center text-slate-500 text-xs">
                                  없음
                                </div>
                              )}
                              <div>
                                <p className="text-slate-200 text-xs font-bold">{r.name}</p>
                                <p className="text-slate-500 text-[10px]">ID: {r.id}</p>
                              </div>
                            </div>
                            <input
                              type="url"
                              value={resultImages[r.id] || ""}
                              onChange={(e) =>
                                setResultImages(prev => ({ ...prev, [r.id]: e.target.value }))
                              }
                              placeholder="이미지 URL 입력"
                              className="w-full p-2 bg-slate-800 text-slate-100 border border-slate-700 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveImages}
                          disabled={isSavingImages}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition disabled:opacity-40"
                        >
                          {isSavingImages ? "저장 중..." : "전체 저장"}
                        </button>
                        <button
                          onClick={() => setEditingTest(null)}
                          className="px-5 py-2 bg-slate-700 text-white rounded-xl font-bold text-sm transition"
                        >
                          닫기
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}