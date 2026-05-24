import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const featureCards = [
  { title: '강의자료 꾸미기', body: 'PDF 위에 밑줄, 형광펜, 메모, 헷갈림 표시를 남깁니다.' },
  { title: '수업시간 채팅', body: '수업 중에만 열리고 종료 후에는 기록으로 남는 강의 맥락 채팅.' },
  { title: '교수님께 한마디', body: '짧은 질문과 피드백을 익명 또는 실명으로 남깁니다.' },
];

const chatMessages = [
  '이 슬라이드 예시 다시 설명 가능할까요?',
  '여기 시험에 나올 것 같음 ⭐',
  '방금 공식 정리해서 올렸어요',
];

function App() {
  return (
    <main className="app-shell">
      <section className="hero-section">
        <nav className="nav-bar">
          <div className="brand-mark">강</div>
          <span>강꾸 Kangku</span>
          <button>앱 미리보기</button>
        </nav>
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Decorate your lecture</p>
            <h1>수업을 듣는 것에서, 꾸미는 것으로.</h1>
            <p>
              강꾸는 강의자료 위에 필기, 채팅, 공부 기록, 피드백을 얹어
              수업을 함께 꾸미는 앱입니다.
            </p>
            <div className="hero-actions">
              <button className="primary">강의자료 꾸미기</button>
              <button className="secondary">수업 채팅 보기</button>
            </div>
          </div>
          <PhoneFrame title="UX 디자인 3주차">
            <LectureCanvasScreen />
          </PhoneFrame>
        </div>
      </section>

      <section className="section-heading">
        <p className="eyebrow">Core experience</p>
        <h2>강의자료를 중심으로 반응, 질문, 필기, 피드백이 모입니다.</h2>
      </section>

      <section className="screens-grid">
        <PhoneFrame title="강의자료 꾸미기">
          <LectureCanvasScreen />
        </PhoneFrame>
        <PhoneFrame title="수업시간 채팅">
          <ClassChatScreen />
        </PhoneFrame>
        <PhoneFrame title="교수님께 한마디">
          <FeedbackScreen />
        </PhoneFrame>
      </section>

      <section className="feature-grid">
        {featureCards.map((feature) => (
          <article key={feature.title}>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

function PhoneFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="phone-card">
      <div className="phone-top"><span />{title}</div>
      <div className="phone-screen">{children}</div>
    </article>
  );
}

function LectureCanvasScreen() {
  return (
    <div className="lecture-screen">
      <div className="screen-header">
        <span className="status-pill">LIVE · 10:15</span>
        <strong>강의자료 꾸미기</strong>
      </div>
      <div className="pdf-card">
        <div className="slide-title">Week 03 · User Research</div>
        <div className="highlight one">사용자 인터뷰 질문 설계</div>
        <div className="highlight two">관찰 → 패턴 → 인사이트</div>
        <div className="sticky-note">이 부분 헷갈림</div>
        <div className="doodle-line" />
      </div>
      <div className="tool-row">
        <span>형광펜</span><span>메모</span><span>스티커</span><span>질문</span>
      </div>
      <button className="full-button">내 꾸미기 저장하기</button>
    </div>
  );
}

function ClassChatScreen() {
  return (
    <div className="chat-screen">
      <div className="screen-header">
        <span className="status-pill">수업 중 작성 가능</span>
        <strong>강의 채팅</strong>
      </div>
      <div className="chat-list">
        {chatMessages.map((message, index) => (
          <div className="chat-bubble" key={message}>
            <b>{['minji', 'hyun', 'seo'][index]}</b>
            <span>{message}</span>
          </div>
        ))}
      </div>
      <div className="locked-note">수업 종료 후 채팅은 잠기고 기록만 남아요.</div>
    </div>
  );
}

function FeedbackScreen() {
  return (
    <div className="feedback-screen">
      <div className="screen-header">
        <span className="status-pill soft">익명 가능</span>
        <strong>교수님께 한마디</strong>
      </div>
      <h3>오늘 수업 어땠나요?</h3>
      <div className="feedback-card">“이 부분 다시 설명해주세요”</div>
      <div className="feedback-card">“오늘 예시 좋았어요”</div>
      <div className="feedback-card">“시험 범위 궁금해요”</div>
      <button className="full-button">한마디 남기기</button>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
