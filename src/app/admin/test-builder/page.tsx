// src/app/admin/test-builder/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  collection, addDoc, getDocs, doc, deleteDoc, setDoc,
  serverTimestamp, query, orderBy, updateDoc,
} from "firebase/firestore";
import { db, storage } from "../../../lib/firebase";
import { useStorageUpload } from "../../../hooks/useStorageUpload";

const MBTI_LIST = [
  "ENFJ","ENFP","ENTJ","ENTP",
  "ESFJ","ESFP","ESTJ","ESTP",
  "INFJ","INFP","INTJ","INTP",
  "ISFJ","ISFP","ISTJ","ISTP",
];

const MBTI_COMPATIBLE: Record<string, { best: string; opposite: string }> = {
  ENFJ:{best:"INFP",opposite:"ISTP"},ENFP:{best:"INTJ",opposite:"ISTJ"},
  ENTJ:{best:"INTP",opposite:"ISFP"},ENTP:{best:"INFJ",opposite:"ISFJ"},
  ESFJ:{best:"ISFP",opposite:"INTP"},ESFP:{best:"ISFJ",opposite:"INTJ"},
  ESTJ:{best:"ISTP",opposite:"INFP"},ESTP:{best:"ISFJ",opposite:"INFJ"},
  INFJ:{best:"ENFP",opposite:"ESTP"},INFP:{best:"ENFJ",opposite:"ESTJ"},
  INTJ:{best:"ENFP",opposite:"ESFP"},INTP:{best:"ENTJ",opposite:"ESFJ"},
  ISFJ:{best:"ESFP",opposite:"ENTP"},ISFP:{best:"ESFJ",opposite:"ENTJ"},
  ISTJ:{best:"ESTP",opposite:"ENFP"},ISTP:{best:"ESTJ",opposite:"ENFJ"},
};

interface TestResult {
  id: string; name: string; description: string;
  mbti?: string; bestMbti?: string; oppositeMbti?: string;
  imageUrl?: string; emoji?: string;
}
interface TestQuestion {
  id: number; text: string;
  options: { text: string; value: string }[];
}
interface CustomTest {
  id?: string; title: string; description: string; slug: string; emoji: string;
  questions: TestQuestion[]; results: TestResult[];
  isActive: boolean; createdAt?: any;
}

type Step = "setup" | "prompt" | "json" | "images" | "publish";

export default function TestBuilderPage() {
  const [tests, setTests] = useState<CustomTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("setup");

  const [topic, setTopic] = useState("");
  const [choiceCount, setChoiceCount] = useState<2|3|4>(4);
  const resultCount = 16; // 항상 16개 고정

  // 수정 모드
  const [editingTest, setEditingTest] = useState<CustomTest | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUploadingId, setEditUploadingId] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [testTitle, setTestTitle] = useState("");
  const [testDesc, setTestDesc] = useState("");
  const [testSlug, setTestSlug] = useState("");
  const [testEmoji, setTestEmoji] = useState("🧠");

  const [jsonText, setJsonText] = useState("");
  const [parsedTest, setParsedTest] = useState<Partial<CustomTest> | null>(null);
  const [parseError, setParseError] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [generatedJsonTemplate, setGeneratedJsonTemplate] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { uploadFile, uploadState, reset: resetUpload } = useStorageUpload();

  useEffect(() => { loadTests(); }, []);

  const loadTests = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "custom_tests"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setTests(snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomTest)));
    } catch {}
    setLoading(false);
  };

  const generatePromptAndTemplate = () => {
    if (!topic.trim()) return alert("주제를 입력해주세요.");
    const labels = Array.from({ length: choiceCount }, (_, i) => String.fromCharCode(65 + i));

    const prompt = `아래 조건으로 심리 테스트 JSON 데이터를 만들어줘.

[테스트 주제]
${topic}

[조건]
- 질문 수: 12개
- 각 질문의 선택지: ${choiceCount}개
- 결과 유형: ${resultCount}개
- 언어: 한국어, 친근하고 재미있게

[JSON 형식 — 이 형식 그대로, JSON만 출력, 마크다운 블록 금지]
{
  "questions": [
    {
      "id": 1,
      "text": "질문 내용",
      "options": [
        ${labels.map((l, i) => `{ "text": "선택지 ${l}", "value": "result_${(i % resultCount) + 1}" }`).join(',\n        ')}
      ]
    }
  ],
  "results": [
    {
      "id": "result_1",
      "name": "결과 유형 이름",
      "description": "결과 설명 2~3문장",
      "mbti": "INFP",
      "emoji": "🌙"
    }
  ]
}

[주의]
- JSON만 출력 (다른 텍스트 없음)
- questions 12개, 각 options ${choiceCount}개 필수
- results ${resultCount}개, mbti는 16개 MBTI 중 하나`;

    const template = {
      questions: [{ id: 1, text: "질문 예시", options: labels.map((l, i) => ({ text: `선택지 ${l}`, value: `result_${(i%16)+1}` })) }],
      results: MBTI_LIST.map((mbti, i) => ({ id: `result_${i+1}`, name: `${mbti} 유형`, description: "설명", mbti, emoji: "🧠" }))
    };

    setGeneratedPrompt(prompt);
    setGeneratedJsonTemplate(JSON.stringify(template, null, 2));
    setStep("prompt");
  };

  const parseJson = () => {
    setParseError("");
    try {
      const clean = jsonText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
      const data = JSON.parse(clean);
      if (!data.questions || !data.results) throw new Error("questions 또는 results 필드가 없습니다.");
      const resultsWithCompat = data.results.map((r: TestResult) => ({
        ...r,
        bestMbti: r.mbti ? MBTI_COMPATIBLE[r.mbti]?.best : undefined,
        oppositeMbti: r.mbti ? MBTI_COMPATIBLE[r.mbti]?.opposite : undefined,
      }));
      const slug = testSlug || topic.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || `test-${Date.now()}`;
      setParsedTest({ title: testTitle || topic, description: testDesc, slug, emoji: testEmoji, questions: data.questions, results: resultsWithCompat, isActive: false });
      setStep("images");
    } catch (e: any) { setParseError("JSON 파싱 오류: " + e.message); }
  };

  const getImagePrompt = (result: TestResult) =>
    `2D illustrated character, personality test result.
Type: "${result.name}" | MBTI: ${result.mbti || ""}
Description: ${result.description}
Style: cute flat 2D illustration, pastel colors, simple clean design,
white background, centered, full body, expressive kawaii face,
square 1:1 ratio, 512x512px, game UI avatar style`;

  const uploadResultImage = async (resultId: string, file: File) => {
    setUploadingId(resultId);
    try {
      const ext = file.name.split(".").pop();
      const path = `test-results/${parsedTest?.slug || "test"}_${resultId}_${Date.now()}.${ext}`;
      const url = await uploadFile(file, path);
      setParsedTest(prev => prev ? { ...prev, results: (prev.results||[]).map(r => r.id===resultId ? {...r, imageUrl: url} : r) } : prev);
    } catch (e: any) { alert("업로드 실패: " + e.message); }
    setUploadingId(null);
    resetUpload();
  };

  // 수정 모드: 이미지 업로드
  const uploadEditImage = async (resultId: string, file: File) => {
    if (!editingTest) return;
    setEditUploadingId(resultId);
    try {
      const ext = file.name.split('.').pop();
      const path = `test-results/${editingTest.slug}_${resultId}_${Date.now()}.${ext}`;
      const url = await uploadFile(file, path);
      setEditingTest(prev => prev ? {
        ...prev,
        results: prev.results.map(r => r.id === resultId ? { ...r, imageUrl: url } : r)
      } : prev);
    } catch (e: any) { alert('업로드 실패: ' + e.message); }
    setEditUploadingId(null);
    resetUpload();
  };

  // 수정 저장
  const saveEdit = async () => {
    if (!editingTest?.id) return;
    setIsSavingEdit(true);
    try {
      const { id, ...data } = editingTest;
      await updateDoc(doc(db, 'custom_tests', id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      setTests(prev => prev.map(t => t.id === editingTest.id ? editingTest : t));
      setShowEditModal(false);
      setEditingTest(null);
      alert('✅ 저장되었습니다!');
    } catch (e: any) { alert('저장 실패: ' + e.message); }
    setIsSavingEdit(false);
  };

  const publishTest = async () => {
    if (!parsedTest?.slug?.trim()) return alert("슬러그를 입력해주세요.");
    setIsSaving(true);
    try {
      await addDoc(collection(db, "custom_tests"), { ...parsedTest, isActive: true, createdAt: serverTimestamp() });
      alert("✅ 발행 완료!");
      setStep("setup"); setTopic(""); setJsonText(""); setParsedTest(null);
      setTestTitle(""); setTestDesc(""); setTestSlug(""); setTestEmoji("🧠");
      loadTests();
    } catch (e: any) { alert("발행 실패: " + e.message); }
    setIsSaving(false);
  };

  const toggleActive = async (test: CustomTest) => {
    if (!test.id) return;
    await updateDoc(doc(db, "custom_tests", test.id), { isActive: !test.isActive });
    setTests(prev => prev.map(t => t.id===test.id ? {...t, isActive: !t.isActive} : t));
  };
  const deleteTest = async (test: CustomTest) => {
    if (!confirm(`"${test.title}" 삭제?`)) return;
    if (test.id) await deleteDoc(doc(db, "custom_tests", test.id));
    setTests(prev => prev.filter(t => t.id!==test.id));
  };

  const STEPS = [
    {key:"setup" as Step, label:"설정", emoji:"⚙️"},
    {key:"prompt" as Step, label:"프롬프트", emoji:"📋"},
    {key:"json" as Step, label:"JSON", emoji:"📥"},
    {key:"images" as Step, label:"이미지", emoji:"🎨"},
    {key:"publish" as Step, label:"발행", emoji:"🚀"},
  ];

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-6">
        <h2 className="text-xl font-black text-slate-100">테스트 빌더</h2>
        <p className="text-xs text-slate-400 mt-1">주제 → AI 프롬프트 → JSON → 이미지 → 발행</p>
      </div>

      {/* 스텝 바 */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
        {STEPS.map(s => (
          <button key={s.key} onClick={() => setStep(s.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition ${
              step===s.key ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}>
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {/* STEP 1: 설정 */}
      {step==="setup" && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-5">
          <h3 className="font-bold text-slate-200">테스트 기본 설정</h3>
          <div>
            <label className="text-xs font-bold text-slate-400 mb-2 block">테스트 주제 *</label>
            <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="예: 나의 연애 스타일, 직장에서 나는 어떤 유형?"
              className="w-full p-3 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 mb-2 block">선택지 개수</label>
              <div className="flex gap-2">
                {([2,3,4] as const).map(n => (
                  <button key={n} onClick={()=>setChoiceCount(n)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${choiceCount===n?"bg-indigo-600 text-white":"bg-slate-700 text-slate-400"}`}>{n}개</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-2 block">결과 유형 수</label>
              <div className="py-2.5 px-3 bg-slate-700 rounded-xl text-xs font-bold text-indigo-300 text-center">
                16개 고정 (MBTI 16유형)
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 mb-2 block">테스트 제목</label>
              <input value={testTitle} onChange={e=>setTestTitle(e.target.value)} placeholder="비우면 주제 사용"
                className="w-full p-3 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-2 block">슬러그 (URL)</label>
              <input value={testSlug} onChange={e=>setTestSlug(e.target.value)} placeholder="my-test-slug"
                className="w-full p-3 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl text-sm focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-400 mb-2 block">설명</label>
              <input value={testDesc} onChange={e=>setTestDesc(e.target.value)} placeholder="테스트 소개 한 줄"
                className="w-full p-3 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-2 block">이모지</label>
              <input value={testEmoji} onChange={e=>setTestEmoji(e.target.value)} maxLength={4}
                className="w-full p-3 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl text-sm text-center focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <button onClick={generatePromptAndTemplate}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition">
            📋 AI 프롬프트 생성하기 →
          </button>
        </div>
      )}

      {/* STEP 2: 프롬프트 */}
      {step==="prompt" && (
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-200">📋 AI 프롬프트 (복사 → ChatGPT/Claude에 붙여넣기)</h3>
              <button onClick={()=>navigator.clipboard.writeText(generatedPrompt).then(()=>alert("복사됨!"))}
                className="px-3 py-1.5 bg-indigo-700 text-white rounded-lg text-xs font-bold">복사</button>
            </div>
            <textarea value={generatedPrompt} readOnly rows={14}
              className="w-full p-3 bg-slate-900 text-slate-300 border border-slate-600 rounded-xl text-xs font-mono resize-none focus:outline-none" />
            <p className="text-slate-500 text-xs mt-2">💡 ChatGPT / Claude / Gemini 등에 붙여넣으면 JSON이 나옵니다.</p>
          </div>
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-200">📄 JSON 형식 참고 템플릿</h3>
              <button onClick={()=>navigator.clipboard.writeText(generatedJsonTemplate).then(()=>alert("복사됨!"))}
                className="px-3 py-1.5 bg-slate-600 text-white rounded-lg text-xs font-bold">복사</button>
            </div>
            <textarea value={generatedJsonTemplate} readOnly rows={8}
              className="w-full p-3 bg-slate-900 text-slate-400 border border-slate-600 rounded-xl text-xs font-mono resize-none focus:outline-none" />
          </div>
          <button onClick={()=>setStep("json")}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition">
            JSON 붙여넣기 →
          </button>
        </div>
      )}

      {/* STEP 3: JSON */}
      {step==="json" && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
          <h3 className="font-bold text-slate-200">📥 AI가 만든 JSON 붙여넣기</h3>
          <textarea value={jsonText} onChange={e=>{setJsonText(e.target.value);setParseError("");}}
            placeholder='{"questions": [...], "results": [...]}' rows={14}
            className="w-full p-3 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl text-xs font-mono resize-none focus:outline-none focus:border-indigo-500" />
          {parseError && <p className="text-red-400 text-xs bg-red-900/30 p-3 rounded-xl">{parseError}</p>}
          <div className="flex gap-3">
            <button onClick={()=>setStep("prompt")} className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold text-sm">← 프롬프트</button>
            <button onClick={parseJson} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition">파싱 & 이미지 →</button>
          </div>
        </div>
      )}

      {/* STEP 4: 이미지 */}
      {step==="images" && parsedTest && (
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
            <h3 className="font-bold text-slate-200 mb-1">🎨 결과 이미지 업로드</h3>
            <p className="text-slate-500 text-xs mb-4">없으면 이모지로 표시 · 건너뛰어도 됩니다</p>
            <div className="space-y-3">
              {(parsedTest.results||[]).map(result => (
                <div key={result.id} className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0 flex items-center justify-center bg-slate-800">
                      {result.imageUrl ? <img src={result.imageUrl} alt={result.name} className="w-full h-full object-cover" /> : <span className="text-2xl">{result.emoji||"🧠"}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <p className="font-bold text-slate-200 text-sm">{result.name}</p>
                        {result.mbti && <span className="text-[10px] bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full">{result.mbti}</span>}
                        {result.bestMbti && <span className="text-[10px] bg-emerald-900 text-emerald-400 px-2 py-0.5 rounded-full">♥ {result.bestMbti}</span>}
                        {result.oppositeMbti && <span className="text-[10px] bg-red-900 text-red-400 px-2 py-0.5 rounded-full">↔ {result.oppositeMbti}</span>}
                      </div>
                      <p className="text-slate-500 text-xs line-clamp-2">{result.description}</p>
                    </div>
                  </div>
                  {/* 이미지 프롬프트 */}
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">🖼️ 2D 캐릭터 이미지 프롬프트</span>
                      <button onClick={()=>navigator.clipboard.writeText(getImagePrompt(result)).then(()=>alert("복사됨!"))}
                        className="text-xs text-indigo-400 hover:text-indigo-300">복사</button>
                    </div>
                    <p className="text-slate-600 text-[10px] font-mono leading-relaxed bg-slate-950 p-2 rounded-lg line-clamp-3">{getImagePrompt(result)}</p>
                  </div>
                  {/* 업로드 */}
                  <div className="mt-3 flex items-center gap-2">
                    <label className="flex-1 cursor-pointer">
                      <div className="py-2 text-center bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs font-bold border border-slate-600 transition">
                        {uploadingId===result.id ? `업로드 중... ${uploadState.progress}%` : result.imageUrl ? "🔄 변경" : "📁 업로드"}
                      </div>
                      <input type="file" accept="image/*" className="hidden" disabled={!!uploadingId}
                        onChange={e=>{const f=e.target.files?.[0]; if(f) uploadResultImage(result.id,f);}} />
                    </label>
                    {result.imageUrl && (
                      <button onClick={()=>setParsedTest(p=>p?{...p,results:(p.results||[]).map(r=>r.id===result.id?{...r,imageUrl:undefined}:r)}:p)}
                        className="px-3 py-2 bg-red-900 hover:bg-red-800 text-red-400 rounded-lg text-xs font-bold">삭제</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={()=>setStep("publish")} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition">발행 단계로 →</button>
        </div>
      )}

      {/* STEP 5: 발행 */}
      {step==="publish" && parsedTest && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-5">
          <h3 className="font-bold text-slate-200">🚀 테스트 발행</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">제목</label>
              <input value={parsedTest.title||""} onChange={e=>setParsedTest(p=>({...p!,title:e.target.value}))}
                className="w-full p-2.5 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">슬러그</label>
              <input value={parsedTest.slug||""} onChange={e=>setParsedTest(p=>({...p!,slug:e.target.value}))}
                className="w-full p-2.5 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl text-sm focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 text-xs text-slate-400 space-y-1">
            <p>📝 질문: <span className="text-white font-bold">{parsedTest.questions?.length||0}개</span></p>
            <p>🏆 결과: <span className="text-white font-bold">{parsedTest.results?.length||0}개</span></p>
            <p>🖼️ 이미지: <span className="text-white font-bold">{parsedTest.results?.filter(r=>r.imageUrl).length||0}개</span></p>
            <p>🔗 URL: <span className="text-indigo-400">/test/{parsedTest.slug}</span></p>
          </div>
          <div className="flex gap-3">
            <button onClick={()=>setStep("images")} className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold text-sm">← 이미지 수정</button>
            <button onClick={publishTest} disabled={isSaving} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm disabled:opacity-40 transition">
              {isSaving?"발행 중...":"✅ 발행하기"}
            </button>
          </div>
        </div>
      )}

      {/* 발행된 테스트 목록 */}
      <div className="mt-10">
        <h3 className="font-bold text-slate-300 mb-4">발행된 테스트 ({tests.length}개)</h3>
        {loading ? (
          <div className="space-y-2">{[1,2].map(i=><div key={i} className="h-16 bg-slate-800 rounded-xl animate-pulse"/>)}</div>
        ) : tests.length===0 ? (
          <div className="text-center py-10 text-slate-500 bg-slate-800 rounded-2xl border border-slate-700">아직 테스트가 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {tests.map(test => (
              <div key={test.id} className={`bg-slate-800 rounded-2xl border p-4 flex items-center gap-4 ${test.isActive?"border-slate-700":"border-slate-700/50 opacity-60"}`}>
                <span className="text-2xl flex-shrink-0">{test.emoji||"🧠"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-200 text-sm truncate">{test.title}</p>
                  <p className="text-slate-500 text-xs">/test/{test.slug} · {test.questions?.length||0}문항 · {test.results?.length||0}결과</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${test.isActive?"bg-emerald-900 text-emerald-400":"bg-slate-700 text-slate-500"}`}>
                    {test.isActive?"활성":"비활성"}
                  </span>
                  <button onClick={()=>toggleActive(test)} className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-bold">
                    {test.isActive?"비활성":"활성화"}
                  </button>
                  <button onClick={()=>{ setEditingTest({...test}); setShowEditModal(true); }}
                    className="px-2.5 py-1 bg-indigo-800 hover:bg-indigo-700 text-indigo-300 rounded-lg text-xs font-bold">수정</button>
                  <button onClick={()=>deleteTest(test)} className="px-2.5 py-1 bg-red-900 hover:bg-red-800 text-red-400 rounded-lg text-xs font-bold">삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 테스트 수정 모달 ── */}
      {showEditModal && editingTest && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-screen flex items-start justify-center p-4 pt-8">
            <div className="bg-slate-900 rounded-3xl border border-slate-700 w-full max-w-2xl shadow-2xl pb-8">
              {/* 헤더 */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <div>
                  <h3 className="font-black text-slate-100 text-lg">테스트 수정</h3>
                  <p className="text-slate-500 text-xs mt-0.5">{editingTest.title}</p>
                </div>
                <button onClick={()=>{ setShowEditModal(false); setEditingTest(null); }}
                  className="text-slate-400 hover:text-slate-200 text-xl font-bold w-8 h-8 flex items-center justify-center">✕</button>
              </div>

              <div className="p-6 space-y-5">
                {/* 기본 정보 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1.5 block">제목</label>
                    <input value={editingTest.title} onChange={e=>setEditingTest(p=>p?{...p,title:e.target.value}:p)}
                      className="w-full p-2.5 bg-slate-800 text-slate-100 border border-slate-600 rounded-xl text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1.5 block">슬러그</label>
                    <input value={editingTest.slug} onChange={e=>setEditingTest(p=>p?{...p,slug:e.target.value}:p)}
                      className="w-full p-2.5 bg-slate-800 text-slate-100 border border-slate-600 rounded-xl text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-400 mb-1.5 block">설명</label>
                    <input value={editingTest.description} onChange={e=>setEditingTest(p=>p?{...p,description:e.target.value}:p)}
                      className="w-full p-2.5 bg-slate-800 text-slate-100 border border-slate-600 rounded-xl text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1.5 block">이모지</label>
                    <input value={editingTest.emoji} onChange={e=>setEditingTest(p=>p?{...p,emoji:e.target.value}:p)}
                      maxLength={4} className="w-full p-2.5 bg-slate-800 text-slate-100 border border-slate-600 rounded-xl text-sm text-center focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>

                {/* 결과 이미지 관리 */}
                <div>
                  <h4 className="font-bold text-slate-300 text-sm mb-3">🎨 결과 이미지 관리 ({editingTest.results.length}개)</h4>
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {editingTest.results.map(result => (
                      <div key={result.id} className="bg-slate-800 rounded-2xl p-3 border border-slate-700">
                        <div className="flex items-center gap-3">
                          {/* 이미지 미리보기 */}
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-600 flex-shrink-0 flex items-center justify-center bg-slate-700">
                            {result.imageUrl
                              ? <img src={result.imageUrl} alt={result.name} className="w-full h-full object-cover" />
                              : <span className="text-xl">{result.emoji||'🧠'}</span>
                            }
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1 mb-0.5">
                              <p className="font-bold text-slate-200 text-xs">{result.name}</p>
                              {result.mbti && <span className="text-[9px] bg-indigo-900 text-indigo-300 px-1.5 py-0.5 rounded-full">{result.mbti}</span>}
                              {result.bestMbti && <span className="text-[9px] bg-emerald-900 text-emerald-400 px-1.5 py-0.5 rounded-full">♥{result.bestMbti}</span>}
                              {result.oppositeMbti && <span className="text-[9px] bg-red-900 text-red-400 px-1.5 py-0.5 rounded-full">↔{result.oppositeMbti}</span>}
                            </div>
                            <p className="text-slate-500 text-[10px] line-clamp-1">{result.description}</p>
                          </div>

                          {/* 업로드/삭제 버튼 */}
                          <div className="flex gap-1.5 flex-shrink-0">
                            <label className="cursor-pointer">
                              <div className="px-2.5 py-1.5 bg-indigo-800 hover:bg-indigo-700 text-indigo-300 rounded-lg text-[10px] font-bold transition whitespace-nowrap">
                                {editUploadingId === result.id
                                  ? `${uploadState.progress}%`
                                  : result.imageUrl ? '변경' : '업로드'}
                              </div>
                              <input type="file" accept="image/*" className="hidden"
                                disabled={!!editUploadingId}
                                onChange={e=>{ const f=e.target.files?.[0]; if(f) uploadEditImage(result.id, f); }} />
                            </label>
                            {result.imageUrl && (
                              <button
                                onClick={()=>setEditingTest(p=>p?{...p,results:p.results.map(r=>r.id===result.id?{...r,imageUrl:undefined}:r)}:p)}
                                className="px-2 py-1.5 bg-red-900 hover:bg-red-800 text-red-400 rounded-lg text-[10px] font-bold">
                                삭제
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 이미지 프롬프트 */}
                        <div className="mt-2 pt-2 border-t border-slate-700 flex items-center justify-between">
                          <p className="text-slate-600 text-[9px] font-mono flex-1 mr-2 truncate">
                            2D character: "{result.name}" {result.mbti} kawaii flat illustration
                          </p>
                          <button
                            onClick={()=>navigator.clipboard.writeText(
                              `2D illustrated character, personality test result.\nType: "${result.name}" | MBTI: ${result.mbti||''}\nDescription: ${result.description}\nStyle: cute flat 2D illustration, pastel colors, white background, centered, kawaii, 512x512px`
                            ).then(()=>alert('복사됨!'))}
                            className="text-[9px] text-indigo-400 hover:text-indigo-300 flex-shrink-0">
                            프롬프트복사
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 저장 버튼 */}
                <div className="flex gap-3 pt-2">
                  <button onClick={()=>{ setShowEditModal(false); setEditingTest(null); }}
                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-bold text-sm transition">
                    취소
                  </button>
                  <button onClick={saveEdit} disabled={isSavingEdit}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm transition disabled:opacity-40">
                    {isSavingEdit ? '저장 중...' : '💾 저장하기'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}