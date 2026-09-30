import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowCounterClockwise,
  BookOpen,
  Check,
  Cloud,
  Heart,
  Leaf,
  Lightbulb,
  Plant,
  SpeakerHigh,
  SpeakerSlash,
  Sparkle,
  Star,
  Tree,
  X,
} from '@phosphor-icons/react';
import {
  answerHint,
  canExchange,
  canSend,
  chapters,
  digits,
  exchange,
  hint,
  initialBlocks,
  isDelivered,
  placeNames,
  sendBlock,
  total,
  unitNames,
} from './game/logic';
import type { Blocks, Place } from './game/logic';
import { readProgress, saveProgress } from './game/storage';
import { playSound } from './game/sound';
import FoxFace from './components/FoxFace';

const ForestScene = lazy(() => import('./components/ForestScene'));
const chapterIcons = [Tree, Plant, Star, Cloud];
const moods = [
  { label: '好期待', response: '把好奇心帶上，我們一起發現減法的小秘密！' },
  { label: '想慢慢來', response: '當然可以。森林沒有倒數，我會陪你慢慢想。' },
  { label: '有點緊張', response: '沒關係，不用一次就會。我們先試一小步就好。' },
];

export default function App() {
  const [progress, setProgress] = useState(readProgress);
  const [page, setPage] = useState<'home' | 'game' | 'finish'>('home');
  const [chapter, setChapter] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [blocks, setBlocks] = useState<Blocks>(() =>
    initialBlocks(chapters[0].questions[0]),
  );
  const [history, setHistory] = useState<Blocks[]>([]);
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('');
  const [solved, setSolved] = useState(false);
  const [mood, setMood] = useState(0);
  const [modal, setModal] = useState<'help' | 'collection' | null>(null);
  const [storageNotice, setStorageNotice] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const answerInput = useRef<HTMLInputElement>(null);
  const current = chapters[chapter];
  const question = current.questions[questionIndex];
  const target = digits(question.bottom);
  const regrouped = blocks.remaining.map((value, i) => value + blocks.sent[i]);
  const hasRegrouped = regrouped.some(
    (value, i) => value !== digits(question.top)[i],
  );

  useEffect(() => {
    setStorageNotice(!saveProgress(progress));
  }, [progress]);
  useEffect(() => {
    if (modal) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal]);
  useEffect(() => {
    document.title =
      page === 'home'
        ? '暖暖森林｜國小三年級 3D 三位數減法教學遊戲'
        : `${page === 'game' ? current.name : '謝謝你，小小冒險家'}｜暖暖森林三位數減法冒險`;
    if (page !== 'home') heading.current?.focus();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [page, chapter, questionIndex, current.name]);
  useEffect(() => {
    if (solved) nextButton.current?.focus();
  }, [solved]);

  function sound(kind: 'tap' | 'exchange' | 'success') {
    if (progress.sound) playSound(kind);
  }
  function loadQuestion(index: number, chapterId = chapter) {
    const q = chapters[chapterId].questions[index];
    setQuestionIndex(index);
    setBlocks(initialBlocks(q));
    setHistory([]);
    setAnswer('');
    setSolved(false);
    setMessage('先想一想會剩下多少，也可以用積木動手試試。我會在這裡陪你。');
  }
  function start(chapterId: number) {
    setChapter(chapterId);
    loadQuestion(0, chapterId);
    setPage('game');
    sound('tap');
  }
  function updateBlocks(next: Blocks, feedback: string) {
    if (solved || next === blocks) return;
    setHistory((previous) => [...previous, blocks]);
    setBlocks(next);
    setMessage(feedback);
  }
  function send(place: Place) {
    if (!canSend(blocks, question, place) || solved) return;
    const next = sendBlock(blocks, question, place);
    updateBlocks(
      next,
      isDelivered(next, question)
        ? hint(next, question)
        : `送出 1 ${unitNames[place]}了。${hint(next, question)}`,
    );
    sound('tap');
  }
  function swap(from: 1 | 2) {
    const next = exchange(blocks, question, from);
    updateBlocks(
      next,
      `你發現了！1 ${unitNames[from]}可以換成 10 ${unitNames[from - 1]}，總量沒有改變。${hint(next, question)}`,
    );
    sound('exchange');
  }
  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setBlocks(previous);
    setHistory((old) => old.slice(0, -1));
    setMessage('回到上一步了。換個方法試試，也是一種發現。');
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (solved) return;
    const feedback = answerHint(answer, question);
    if (feedback) {
      setMessage(feedback);
      answerInput.current?.focus();
      return;
    }
    setSolved(true);
    setMessage('你找到答案了！願意動腦想、動手試，就是很棒的學習。');
    sound('success');
  }
  function next() {
    if (questionIndex < current.questions.length - 1)
      loadQuestion(questionIndex + 1);
    else {
      setProgress((old) => ({
        ...old,
        completed: [...new Set([...old.completed, chapter])],
      }));
      setPage('finish');
    }
  }

  return (
    <>
      <a className="skip-link" href="#main">
        跳到遊戲內容
      </a>
      <header className="site-header">
        <button
          className="brand"
          onClick={() => setPage('home')}
          aria-label="暖暖森林首頁"
        >
          <span className="brand-mark">
            <Tree weight="fill" size={27} />
          </span>
          <span>
            暖暖森林<small>小小減法 · 大大冒險</small>
          </span>
        </button>
        <nav className="header-actions" aria-label="主要功能">
          <button
            className="collection-button"
            aria-label={`我的紀念冊，已收集 ${progress.completed.length} 份心意`}
            onClick={() => setModal('collection')}
          >
            <Leaf size={19} />
            <span>我的紀念冊</span>
            <b>{progress.completed.length}</b>
          </button>
          <span className="header-divider" />
          <button
            className="icon-button"
            onClick={() =>
              setProgress((old) => ({ ...old, sound: !old.sound }))
            }
            aria-label={progress.sound ? '關閉音效' : '開啟音效'}
            title={progress.sound ? '關閉音效' : '開啟音效'}
          >
            {progress.sound ? (
              <SpeakerHigh size={21} />
            ) : (
              <SpeakerSlash size={21} />
            )}
          </button>
          <button
            className="icon-button"
            onClick={() => setModal('help')}
            aria-label="遊戲說明"
            title="遊戲說明"
          >
            <BookOpen size={21} />
          </button>
        </nav>
      </header>

      <main id="main" tabIndex={-1}>
        {page === 'home' && (
          <div className="home page-width">
            <section className="hero">
              <div className="hero-copy">
                <p className="eyebrow">
                  <span /> 給三年級的你，一場剛剛好的冒險
                </p>
                <h1>
                  每一次嘗試，
                  <br />
                  都讓森林更
                  <span className="warm-word">
                    溫暖
                    <svg viewBox="0 0 180 12" aria-hidden="true">
                      <path d="M3 8Q87 0 177 7" />
                    </svg>
                  </span>
                  。
                </h1>
                <p className="hero-description">
                  和小狐狸一起，用積木解開三位數減法。
                  <br />
                  動動手、想一想，把小小的幫助送給森林朋友。
                </p>
                <button
                  className="primary-button adventure-button"
                  onClick={() =>
                    start(
                      progress.completed.length === 4
                        ? 0
                        : chapters.findIndex(
                            (_, i) => !progress.completed.includes(i),
                          ),
                    )
                  }
                >
                  開始我的冒險 <ArrowRight size={21} weight="bold" />
                </button>
                <p className="hero-reassurance">
                  <Heart size={16} weight="fill" />{' '}
                  不用急，不怕錯，每一步都算數。
                </p>
              </div>
              <div className="hero-world">
                <div className="sun-disc" />
                <div className="world-cloud cloud-one" />
                <div className="world-cloud cloud-two" />
                <span className="world-caption">
                  <Leaf size={15} weight="fill" /> 今天的森林，也在等你
                </span>
                <Suspense
                  fallback={
                    <div className="scene-loading">正在種下你的森林…</div>
                  }
                >
                  <ForestScene
                    mode="forest"
                    completed={progress.completed.length}
                  />
                </Suspense>
                <span className="rotate-hint">
                  <ArrowCounterClockwise size={14} /> 拖曳，轉轉森林
                </span>
              </div>
            </section>

            <section className="mood-bar" aria-labelledby="mood-title">
              <FoxFace small />
              <div className="mood-intro">
                <h2 id="mood-title">嗨，我是小狐狸暖暖！</h2>
                <p>{moods[mood].response}</p>
              </div>
              <div className="mood-options">
                <span>今天的心情</span>
                <div>
                  {moods.map((item, index) => (
                    <button
                      key={item.label}
                      aria-pressed={mood === index}
                      onClick={() => setMood(index)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="journeys" aria-labelledby="journey-title">
              <div className="section-title">
                <div>
                  <p className="eyebrow">YOUR LITTLE ADVENTURE</p>
                  <h2 id="journey-title">今天，想去哪裡探險？</h2>
                </div>
                <p>從第一站出發，也可以挑一站試試。</p>
              </div>
              <div className="chapter-grid">
                {chapters.map((item, index) => {
                  const Icon = chapterIcons[index];
                  const done = progress.completed.includes(index);
                  return (
                    <button
                      className={`chapter-card ${item.color}`}
                      key={item.name}
                      onClick={() => start(index)}
                    >
                      <div className="chapter-top">
                        <span className="chapter-number">0{index + 1}</span>
                        <span className="chapter-state">
                          {done ? (
                            <>
                              <Check size={14} weight="bold" /> 已留下足跡
                            </>
                          ) : index === 0 ? (
                            '從這裡開始'
                          ) : (
                            '等你來探索'
                          )}
                        </span>
                      </div>
                      <div className="chapter-art">
                        <span />
                        <Icon size={51} weight="duotone" />
                      </div>
                      <h3>{item.name}</h3>
                      <p>
                        {item.skill}
                        <span> · 3 個小任務</span>
                      </p>
                      <span className="chapter-arrow">
                        <ArrowRight size={19} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
            <footer className="home-footer">
              <span>
                <Plant size={17} /> 在這裡，好奇心比速度更重要。
              </span>
              <span>
                3D 互動學習 <i /> 三位數減法 <i /> 安心探索
              </span>
            </footer>
          </div>
        )}

        {page === 'game' && (
          <div className="game page-width">
            <div className="game-navigation">
              <button className="text-button" onClick={() => setPage('home')}>
                <ArrowLeft size={18} /> 回森林
              </button>
              <span>
                {current.name} <i>/</i> {current.skill}
              </span>
              <div
                className="task-progress"
                aria-label={`第 ${questionIndex + 1} 個任務，共 3 個`}
              >
                {[0, 1, 2].map((index) => (
                  <span
                    className={
                      index < questionIndex ||
                      (solved && index === questionIndex)
                        ? 'done'
                        : index === questionIndex
                          ? 'active'
                          : ''
                    }
                    key={index}
                  >
                    {index < questionIndex ? <Check size={14} /> : index + 1}
                  </span>
                ))}
              </div>
            </div>
            <div className="game-heading">
              <div>
                <p className="eyebrow">
                  第 {questionIndex + 1} 個小任務 · {current.friend}的委託
                </p>
                <h1 ref={heading} tabIndex={-1}>
                  {current.title}
                </h1>
              </div>
              <span className="no-timer">
                <Heart size={17} /> 慢慢想，我們有時間
              </span>
            </div>
            <p className="story">
              原本有 <strong>{question.top}</strong> {current.item}，送給朋友{' '}
              <strong>{question.bottom}</strong> {current.item}，還剩下多少呢？
            </p>
            <div className="game-layout">
              <section className="workbench" aria-label="位值積木操作區">
                <div className="workbench-header">
                  <span>
                    <span className="live-dot" /> 動手試一試
                  </span>
                  <button
                    className="text-button"
                    disabled={history.length === 0 || solved}
                    onClick={undo}
                  >
                    <ArrowCounterClockwise size={16} /> 退回一步
                  </button>
                </div>
                <div className="block-world">
                  <Suspense
                    fallback={<div className="scene-loading">積木準備中…</div>}
                  >
                    <ForestScene
                      mode="blocks"
                      counts={blocks.remaining}
                      onBlock={send}
                    />
                  </Suspense>
                  <span className="block-scene-hint">
                    點積木送出一塊 · 拖曳可旋轉
                  </span>
                </div>
                <div className="place-controls">
                  {([2, 1, 0] as Place[]).map((place) => (
                    <div className={`place-column place-${place}`} key={place}>
                      <h2>
                        {placeNames[place]}{' '}
                        <span>
                          1 {unitNames[place]} = {10 ** place}
                        </span>
                      </h2>
                      <p className="stock">
                        剩下 <strong>{blocks.remaining[place]}</strong>{' '}
                        {unitNames[place]}
                      </p>
                      <p className="sent-count">
                        已送出 {blocks.sent[place]} / {target[place]}{' '}
                        {unitNames[place]}{' '}
                        {blocks.sent[place] === target[place] && (
                          <Check size={13} weight="bold" />
                        )}
                      </p>
                      <button
                        className="send-button"
                        disabled={solved || !canSend(blocks, question, place)}
                        onClick={() => send(place)}
                      >
                        送出 1 {unitNames[place]} <ArrowRight size={14} />
                      </button>
                      {place > 0 ? (
                        <button
                          className="exchange-button"
                          disabled={
                            solved ||
                            !canExchange(blocks, question, place as 1 | 2)
                          }
                          onClick={() => swap(place as 1 | 2)}
                        >
                          1 {unitNames[place]}換 10 {unitNames[place - 1]}
                        </button>
                      ) : (
                        <span className="unit-note">小方塊代表 1</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="workbench-footer">
                  <Leaf size={16} />
                  <span>一大片 = 10 條長條，一條長條 = 10 個小方塊。</span>
                  <b>
                    已送出 {total(blocks.sent)} / {question.bottom}
                  </b>
                </div>
              </section>
              <section
                className={`answer-panel ${solved ? 'is-solved' : ''}`}
                aria-label="直式算式與作答"
              >
                <div className="answer-title">
                  <span className="round-icon">
                    <Lightbulb size={21} />
                  </span>
                  <h2>{solved ? '你發現答案了！' : '把你的想法寫下來'}</h2>
                </div>
                <div
                  className="calculation"
                  aria-label={`${question.top} 減 ${question.bottom}`}
                >
                  <div className="math-row labels">
                    <span />
                    <span>百</span>
                    <span>十</span>
                    <span>個</span>
                  </div>
                  {hasRegrouped && (
                    <div className="math-row regrouped">
                      <span>換開</span>
                      {[2, 1, 0].map((p) => (
                        <b key={p}>{regrouped[p]}</b>
                      ))}
                    </div>
                  )}
                  <div
                    className={`math-row top-number ${hasRegrouped ? 'original' : ''}`}
                  >
                    <span />
                    {[2, 1, 0].map((p) => (
                      <span key={p}>{digits(question.top)[p]}</span>
                    ))}
                  </div>
                  <div className="math-row">
                    <span>−</span>
                    {[2, 1, 0].map((p) => (
                      <span key={p}>{target[p]}</span>
                    ))}
                  </div>
                </div>
                <form onSubmit={submit}>
                  <label htmlFor="answer">還剩下多少？</label>
                  <div className="answer-input-wrap">
                    <input
                      id="answer"
                      ref={answerInput}
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={3}
                      placeholder="想一想"
                      value={answer}
                      readOnly={solved}
                      onChange={(event) =>
                        setAnswer(
                          event.target.value.replace(/[^0-9]/g, '').slice(0, 3),
                        )
                      }
                      aria-describedby="companion-message"
                    />
                    <span>{current.item}</span>
                  </div>
                  {solved ? (
                    <div className="solved-note">
                      <Check size={20} weight="bold" /> {question.top} −{' '}
                      {question.bottom} = {question.top - question.bottom}
                    </div>
                  ) : (
                    <button
                      className="primary-button check-button"
                      type="submit"
                    >
                      我想好了 <ArrowRight size={18} />
                    </button>
                  )}
                </form>
                {solved ? (
                  <>
                    <p className="verification">
                      加回去檢查：
                      <br />
                      <b>
                        {question.top - question.bottom} + {question.bottom} ={' '}
                        {question.top}
                      </b>
                    </p>
                    <button
                      className="primary-button check-button"
                      ref={nextButton}
                      onClick={next}
                    >
                      {questionIndex === 2 ? '收下朋友的心意' : '下一個小任務'}{' '}
                      <ArrowRight size={18} />
                    </button>
                  </>
                ) : (
                  <button
                    className="hint-button"
                    onClick={() => setMessage(hint(blocks, question))}
                  >
                    <Lightbulb size={17} /> 暖暖，給我一點提示
                  </button>
                )}
              </section>
            </div>
            <div className={`companion ${solved ? 'celebrate' : ''}`}>
              <FoxFace />
              <div>
                <span className="companion-name">
                  小狐狸暖暖 {solved && <Sparkle size={16} weight="fill" />}
                </span>
                <p
                  id="companion-message"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {message}
                </p>
              </div>
            </div>
          </div>
        )}

        {page === 'finish' && (
          <section className="finish page-width">
            <div className={`achievement-medal ${current.color}`}>
              <Leaf size={58} weight="duotone" />
              <span>
                <Check size={18} weight="bold" />
              </span>
            </div>
            <p className="eyebrow">一段旅程，三次美好的嘗試</p>
            <h1 ref={heading} tabIndex={-1}>
              謝謝你，小小冒險家！
            </h1>
            <p className="finish-subtitle">
              你完成了「{current.name}」，把一份溫暖留在森林。
            </p>
            <div className="thank-you">
              <FoxFace />
              <blockquote>
                「{current.thanks}」<cite>—— {current.friend}</cite>
              </blockquote>
            </div>
            <div className="earned-badge">
              <Star size={25} weight="duotone" />
              <div>
                <span>紀念冊裡，多了一份心意</span>
                <strong>{current.badge}</strong>
              </div>
              <Check size={21} />
            </div>
            <p className="reflection">
              回想一下：今天的哪一步，讓你突然懂了？
              <br />
              <span>可以說給身邊的人聽，也可以自己想一想。</span>
            </p>
            <div className="finish-actions">
              <button
                className="secondary-button"
                onClick={() => setPage('home')}
              >
                <ArrowLeft size={18} /> 回森林休息
              </button>
              <button
                className="primary-button"
                onClick={() => start((chapter + 1) % chapters.length)}
              >
                {chapter === 3 ? '再走一段旅程' : '探索下一站'}{' '}
                <ArrowRight size={18} />
              </button>
            </div>
          </section>
        )}
      </main>
      {storageNotice && (
        <p className="storage-notice" role="status">
          這個瀏覽器暫時無法保存紀念冊，這次仍然可以繼續玩。
        </p>
      )}

      <dialog
        ref={dialog}
        className="info-dialog"
        onClose={() => setModal(null)}
        aria-labelledby="dialog-title"
      >
        <button
          className="icon-button dialog-close"
          onClick={() => setModal(null)}
          aria-label="關閉視窗"
        >
          <X size={23} />
        </button>
        {modal === 'help' ? (
          <>
            <span className="dialog-symbol">
              <BookOpen size={30} weight="duotone" />
            </span>
            <h2 id="dialog-title">一起發現減法的小秘密</h2>
            <p>
              先想答案，或先玩積木，都可以。這裡沒有計時，也不會因為答錯扣分。
            </p>
            <ol className="help-steps">
              <li>
                <strong>看看朋友需要什麼</strong>
                <span>用「原本有的 − 送出去的」，算出還剩多少。</span>
              </li>
              <li>
                <strong>從個位開始，試著送出積木</strong>
                <span>一大片是 100，一條是 10，一小塊是 1。</span>
              </li>
              <li>
                <strong>不夠送的時候，換一換</strong>
                <span>
                  1 個百換 10 個十；1 個十換 10 個一。數量換了模樣，總量不變。
                </span>
              </li>
              <li>
                <strong>寫下答案，再加回去檢查</strong>
                <span>有新的想法時，隨時可以退回上一步。</span>
              </li>
            </ol>
            <p className="help-note">
              可以用滑鼠或觸控操作。鍵盤 Tab 移動、Enter
              啟動按鈕；答案欄可直接輸入數字。按 Esc 關閉說明。
            </p>
            <button className="primary-button" onClick={() => setModal(null)}>
              我知道了，一起試試 <ArrowRight size={18} />
            </button>
          </>
        ) : (
          <>
            <span className="dialog-symbol">
              <Leaf size={31} weight="duotone" />
            </span>
            <h2 id="dialog-title">我的森林紀念冊</h2>
            <p>
              每完成一站，就留下一份朋友的心意。
              <br />
              目前留下了 {progress.completed.length} / 4 份美好回憶。
            </p>
            <div className="badge-grid">
              {chapters.map((item, i) => {
                const Icon = chapterIcons[i];
                const earned = progress.completed.includes(i);
                return (
                  <div
                    className={`badge ${earned ? `earned ${item.color}` : ''}`}
                    key={item.name}
                  >
                    <Icon size={33} weight="duotone" />
                    <strong>{item.badge}</strong>
                    <span>
                      {earned ? '謝謝你的陪伴' : `到${item.name}留下足跡`}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="help-note">
              紀念冊保存在這個瀏覽器，不需要登入。換裝置或清除網站資料後，紀錄不會保留。
            </p>
            <button className="primary-button" onClick={() => setModal(null)}>
              繼續我的旅程 <ArrowRight size={18} />
            </button>
          </>
        )}
      </dialog>
    </>
  );
}
