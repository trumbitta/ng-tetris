import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  ChangeDetectionStrategy,
  HostListener
} from '@angular/core';

// App Configurations
import {
  COLS,
  BLOCK_SIZE,
  ROWS,
  Keys,
  COLORS,
  Points,
  LINES_PER_LEVEL,
  levels
} from '../config/app.config';

// App Models
import { Piece, PieceObject } from '../pieces/piece.model';

// App Services
import { GameBoardService } from './game-board.service';
import { PieceService } from '../pieces/piece.service';

@Component({
  selector: 'ng-tetris-game-board',
  template: `
    <main class="my-5">
      <canvas #board class="game-board"></canvas>
      <aside>
        <article>
          <h1>TETRIS</h1>
          <p>Score: {{ points }}</p>
          <p>Lines: {{ lines }}</p>
          <p>Level: {{ level }}</p>
        </article>

        <canvas #nextPiece class="next-piece"></canvas>

        <p class="m-0"><button (click)="play()">Play</button></p>
      </aside>
    </main>
  `,
  styles: [
    `
      main {
        display: grid;
        grid-template-columns: 18.75rem 18rem;
        grid-gap: 2rem;
        justify-content: center;
      }

      .game-board {
        border: 4px solid #444;
      }

      .next-piece {
        height: 16rem;
      }

      aside {
        display: flex;
        justify-content: space-between;
        flex-direction: column;
      }

      h1 {
        font-size: 2.5rem;
      }

      button {
        background-color: green;
        border: 1px solid green;
        display: block;
        width: 100%;
        height: 3rem;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameBoardComponent implements OnInit {
  // Get reference to the canvas.
  @ViewChild('board', { static: true })
  canvasBoard: ElementRef<HTMLCanvasElement>;
  @ViewChild('nextPiece', { static: true })
  canvasNextPiece: ElementRef<HTMLCanvasElement>;

  points: number;
  lines: number;
  level: number;

  private canvasRenderingContextBoard: CanvasRenderingContext2D;
  private canvasRenderingContextNextPiece: CanvasRenderingContext2D;
  private board: number[][];
  private currentPiece: PieceObject;
  private nextPiece: PieceObject;
  private moves = {
    [Keys.LEFT]: (p: Piece): Piece => ({ ...p, x: p.x - 1 }),
    [Keys.RIGHT]: (p: Piece): Piece => ({ ...p, x: p.x + 1 }),
    [Keys.DOWN]: (p: Piece): Piece => ({ ...p, y: p.y + 1 }),
    [Keys.SPACE]: (p: Piece): Piece => ({ ...p, y: p.y + 1 }),
    [Keys.UP]: (p: Piece): Piece => this.pieceService.rotate(p)
  };
  private time = { start: 0, elapsed: 0, level: 1000 };
  private requestAnimationFrameId: number;

  @HostListener('window:keydown', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.keyCode === Keys.ESC) {
      this.gameOver();
    } else if (this.moves[event.keyCode]) {
      // If the keyCode exists in our moves stop the event from bubbling.
      event.preventDefault();
      // Get the next state of the piece.
      let movedPiece = this.moves[event.keyCode](this.currentPiece);

      if (event.keyCode === Keys.SPACE) {
        while (this.pieceService.isValidMove(movedPiece, this.board)) {
          this.points += Points.HARD_DROP;

          this.currentPiece.move(movedPiece);
          movedPiece = this.moves[Keys.DOWN](this.currentPiece);
        }
      } else if (this.pieceService.isValidMove(movedPiece, this.board)) {
        this.currentPiece.move(movedPiece);

        if (event.keyCode === Keys.DOWN) {
          this.points += Points.SOFT_DROP;
        }
      }

      this.draw();
    }
  }

  constructor(
    private gameBoardService: GameBoardService,
    private pieceService: PieceService
  ) {}

  ngOnInit() {
    this.initBoard();
    this.initNextPiece();
    this.resetGame();
  }

  play() {
    if (this.requestAnimationFrameId) {
      cancelAnimationFrame(this.requestAnimationFrameId);
    }

    this.resetGame();
    this.nextPiece = new PieceObject(this.canvasRenderingContextBoard);
    this.currentPiece = new PieceObject(this.canvasRenderingContextBoard);
    this.nextPiece.drawNext(this.canvasRenderingContextNextPiece);
    this.animate();
  }

  private resetGame() {
    this.points = 0;
    this.lines = 0;
    this.level = 0;
    this.board = this.gameBoardService.getEmptyBoard();
  }

  private clearLines() {
    const currentRows = this.board.length;
    const clearedBoard = this.board.filter(
      row => !row.every(value => value > 0)
    );
    const clearedRows: number[][] = Array(
      currentRows - clearedBoard.length
    ).fill(Array(COLS).fill(0));

    this.lines += clearedRows.length;

    if (this.lines >= LINES_PER_LEVEL) {
      this.level++;

      this.lines -= LINES_PER_LEVEL;

      this.time.level = levels[this.level] || levels[levels.length - 1];
    }

    this.points = this.getClearedLinesPoints(
      this.points,
      clearedRows.length,
      this.level
    );
    this.board = [...clearedRows, ...clearedBoard];
  }

  private getClearedLinesPoints(
    currentPoints: number,
    clearedLines: number,
    level: number
  ) {
    return (
      (currentPoints +=
        [0, Points.SINGLE, Points.DOUBLE, Points.TRIPLE, Points.TETRIS][
          clearedLines
        ] || 0) *
      (level + 1)
    );
  }

  private freeze() {
    this.currentPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value > 0) {
          this.board[y + this.currentPiece.y][x + this.currentPiece.x] = value;
        }
      });
    });
  }

  private drawBoard() {
    this.board.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value > 0) {
          this.canvasRenderingContextBoard.fillStyle = COLORS[value];
          this.canvasRenderingContextBoard.fillRect(x, y, 1, 1);
        }
      });
    });
  }

  private animate(now = 0) {
    // Update elapsed time.
    this.time.elapsed = now - this.time.start;
    // If elapsed time has passed time for current level
    if (this.time.elapsed > this.time.level) {
      // Reset start time
      this.time.start = now;
      if (!this.drop()) {
        this.gameOver();

        return;
      }
    }

    this.draw();
    this.requestAnimationFrameId = requestAnimationFrame(
      this.animate.bind(this)
    );
  }

  private gameOver() {
    cancelAnimationFrame(this.requestAnimationFrameId);

    this.canvasRenderingContextBoard.fillStyle = '#444';
    this.canvasRenderingContextBoard.fillRect(0.25, 3, 9.5, 2);
    this.canvasRenderingContextBoard.font = '1px "Press Start 2P"';
    this.canvasRenderingContextBoard.fillStyle = 'red';
    this.canvasRenderingContextBoard.fillText('GAME OVER', 0.55, 4.6);
  }

  private drop(): boolean {
    const movedPiece = this.moves[Keys.DOWN](this.currentPiece);

    if (this.pieceService.isValidMove(movedPiece, this.board)) {
      this.currentPiece.move(movedPiece);
    } else {
      this.freeze();
      this.clearLines();

      if (this.currentPiece.y === 0) {
        return false;
      }

      this.currentPiece = this.nextPiece;
      this.nextPiece = new PieceObject(this.canvasRenderingContextBoard);
      this.nextPiece.drawNext(this.canvasRenderingContextNextPiece);
    }

    return true;
  }

  private draw() {
    // Clear the old position before drawing
    this.canvasRenderingContextBoard.clearRect(
      0,
      0,
      this.canvasRenderingContextBoard.canvas.width,
      this.canvasRenderingContextBoard.canvas.height
    );

    this.currentPiece.draw();
    this.drawBoard();
  }

  private initBoard() {
    // Get the 2D context that we draw on.
    this.canvasRenderingContextBoard = this.canvasBoard.nativeElement.getContext(
      '2d'
    );

    // Calculate size of canvas from constants.
    this.canvasRenderingContextBoard.canvas.width = COLS * BLOCK_SIZE;
    this.canvasRenderingContextBoard.canvas.height = ROWS * BLOCK_SIZE;

    this.canvasRenderingContextBoard.scale(BLOCK_SIZE, BLOCK_SIZE);
  }

  private initNextPiece() {
    // Get the 2D context that we draw on.
    this.canvasRenderingContextNextPiece = this.canvasNextPiece.nativeElement.getContext(
      '2d'
    );

    // Calculate size of canvas from constants.
    this.canvasRenderingContextNextPiece.canvas.width = 4 * BLOCK_SIZE;
    this.canvasRenderingContextNextPiece.canvas.height = 4 * BLOCK_SIZE;

    this.canvasRenderingContextNextPiece.scale(BLOCK_SIZE / 2, BLOCK_SIZE / 2);
  }
}
