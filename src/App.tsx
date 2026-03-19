import { useEffect, useMemo, useState } from 'react'
import './App.css'
// Use `/tulieVoNguyenGiap.mp4` path: đặt file vào thư mục public để dự án build được.

type BingoCellProps = {
  index: number
  value: string
  selected: boolean
  winning: boolean
  onToggle: (index: number) => void
}

const BINGO_ITEMS = [
  'Điện Biên Phủ',
  '1954',
  'Đại tướng',
  'Quân đội nhân dân',
  'Chiến thắng',
  'Việt Nam',
  'Tổng tư lệnh',
  'Kháng chiến',
  'Pháp',
  'Chiến dịch',
  'Lịch sử',
  'Trường Sơn',
  'Biên phòng',
  'Hòa bình',
  'Tướng Giáp',
  'Chiến lược',
  'Bảy lần',
  'Độc lập',
  'Tự do',
  'Nhân dân',
]

const GRID_SIZE = 4

const WIN_LINES = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
  [0, 5, 10, 15],
  [3, 6, 9, 12],
]

const shuffleArray = <T,>(arr: T[]): T[] => {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const getRandomBoard = (): string[] => shuffleArray(BINGO_ITEMS).slice(0, GRID_SIZE * GRID_SIZE)

const checkBingo = (selected: boolean[]): { bingo: boolean; line: number[] | null } => {
  for (const line of WIN_LINES) {
    const matched = line.every((idx) => selected[idx])
    if (matched) return { bingo: true, line }
  }
  return { bingo: false, line: null }
}

const BingoCell: React.FC<BingoCellProps> = ({ index, value, selected, winning, onToggle }) => {
  return (
    <button
      className={
        `cell ${selected ? 'cell-selected' : 'cell-unselected'} ${winning ? 'cell-winning' : ''}`
      }
      onClick={() => onToggle(index)}
      type="button"
      aria-pressed={selected}
    >
      {selected && <div className="cell-glow" />}
      <span>{value}</span>
      {selected && (
        <div className="checkmark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  )
}

const BingoBoard: React.FC<{
  items: string[]
  selected: boolean[]
  onToggle: (index: number) => void
  winningLine: number[] | null
  isGameOver: boolean
}> = ({ items, selected, onToggle, winningLine, isGameOver }) => {
  const winningSet = new Set(winningLine ?? [])
  return (
    <div className="board">
      {items.map((item, idx) => (
        <BingoCell
          key={`${item}-${idx}`}
          index={idx}
          value={item}
          selected={selected[idx]}
          winning={winningSet.has(idx)}
          onToggle={isGameOver ? () => {} : onToggle}
        />
      ))}
    </div>
  )
}

const playBingoTone = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AudioContext()
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15)
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + i * 0.15 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.35)
      osc.start(ctx.currentTime + i * 0.15)
      osc.stop(ctx.currentTime + i * 0.15 + 0.4)
    })
  } catch (err) {
    // ignore autoplay restrictions
  }
}

const generateParticles = () =>
  Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: `${2 + Math.random() * 3}px`,
    delay: `${Math.random() * -20}s`,
    duration: `${15 + Math.random() * 12}s`,
  }))

const WinModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onPlayAgain: () => void
}> = ({ isOpen, onClose, onPlayAgain }) => {
  if (!isOpen) return null
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="trophy">
          <svg viewBox="0 0 24 24" fill="currentColor" className="trophy-icon">
            <path d="M12 2l2.6 5.3 5.9.9-4.3 4.2 1 5.8L12 15.7 6.8 18.2l1-5.8L3.5 8.2l5.9-.9L12 2z" />
          </svg>
        </div>
        <h2 id="modal-title">🎉 Bingo!</h2>
        <p>Chúc mừng bạn đã hoàn thành dòng bingo.</p>
        <div className="modal-controls">
          <button className="btn btn-primary" type="button" onClick={onPlayAgain}>
            Chơi lại
          </button>
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

const App: React.FC = () => {
  const [board, setBoard] = useState<string[]>(() => getRandomBoard())
  const [selected, setSelected] = useState<boolean[]>(() => Array(GRID_SIZE * GRID_SIZE).fill(false))
  const [bingoLine, setBingoLine] = useState<number[] | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [particles] = useState(generateParticles)

  const { bingo } = useMemo(() => checkBingo(selected), [selected])

  useEffect(() => {
    if (bingo) {
      const { line } = checkBingo(selected)
      setBingoLine(line)
      setIsGameOver(true)
      setIsModalOpen(true)
      playBingoTone()
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 2500)
      return () => clearTimeout(timer)
    }
    setBingoLine(null)
    setIsGameOver(false)
    setShowConfetti(false)
  }, [bingo, selected])

  const toggleCell = (index: number) => {
    if (isGameOver) return
    setSelected((prev) => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
  }

  const resetGame = () => {
    setBoard(getRandomBoard())
    setSelected(Array(GRID_SIZE * GRID_SIZE).fill(false))
    setBingoLine(null)
    setIsGameOver(false)
    setIsModalOpen(false)
    setShowConfetti(false)
  }

  const completedCount = selected.filter(Boolean).length

  return (
    <div className="full-page">
      <video className="bg-video" autoPlay muted loop playsInline src="/vonguyengiap.mp4" />
      <div className="bg-pattern" />
      <div className="bg-grid" />
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}

      {showConfetti && (
        <div className="confetti-container" aria-hidden="true">
          {Array.from({ length: 40 }).map((_, i) => {
            const x = Math.random() * 98
            const r = `${Math.random() * 360}deg`
            const hue = 20 + Math.floor(Math.random() * 340)
            return (
              <span
                key={`conf-${i}`}
                className="confetti-piece"
                style={{
                  '--i': hue,
                  '--x': `${x}vw`,
                  '--r': r,
                  backgroundColor: `hsl(${hue}, 95%, 58%)`,
                  left: `${(i / 40) * 100}%`,
                  animationDelay: `${Math.random() * 0.8}s`,
                } as React.CSSProperties}
              />
            )
          })}
        </div>
      )}

      <div className="app-container">
        <header className="header">
          <h1 className="title font-display">BINGO KIẾN THỨC</h1>
          <p className="subtitle">Ôn tập về Đại tướng Võ Nguyên Giáp</p>
        </header>

        <div className="top-controls">
          <button type="button" onClick={resetGame} className="btn btn-primary">
            Chơi lại
          </button>
          <p className="progress-text">Đã chọn: {completedCount}/{GRID_SIZE * GRID_SIZE}</p>
        </div>

        <BingoBoard
          items={board}
          selected={selected}
          onToggle={toggleCell}
          winningLine={bingoLine}
          isGameOver={isGameOver}
        />

        <div className="status-bar">
          {bingo ? (
            <p className="bingo-text">🎉 BINGO! Bạn đã chiến thắng!</p>
          ) : (
            <p className="hint">Chọn 4 ô thẳng hàng ngang, dọc hoặc chéo để bingo.</p>
          )}
        </div>
      </div>

      <WinModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onPlayAgain={resetGame} />
    </div>
  )
}

export default App
