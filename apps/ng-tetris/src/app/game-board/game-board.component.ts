import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  ChangeDetectionStrategy,
  HostListener
} from '@angular/core';

// App Configurations
import { COLS, BLOCK_SIZE, ROWS, Keys, COLORS } from '../config/app.config';

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

      canvas {
        border: 4px solid #444;
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
  canvas: ElementRef<HTMLCanvasElement>;

  points: number;
  lines: number;
  level: number;

  private canvasRenderingContext: CanvasRenderingContext2D;
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

  @HostListener('window:keydown', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (this.moves[event.keyCode]) {
      // If the keyCode exists in our moves stop the event from bubbling.
      event.preventDefault();
      // Get the next state of the piece.
      let movedPiece = this.moves[event.keyCode](this.currentPiece);

      if (event.keyCode === Keys.SPACE) {
        while (this.pieceService.isValidMove(movedPiece, this.board)) {
          this.currentPiece.move(movedPiece);

          movedPiece = this.moves[Keys.DOWN](this.currentPiece);
        }
      } else if (this.pieceService.isValidMove(movedPiece, this.board)) {
        this.currentPiece.move(movedPiece);
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
  }

  play() {
    this.board = this.gameBoardService.getEmptyBoard();
    this.currentPiece = new PieceObject(this.canvasRenderingContext);
    this.nextPiece = new PieceObject(this.canvasRenderingContext);
    this.animate();

    console.table(this.board);
  }

  private clearLines() {
    const currentRows = this.board.length;
    const clearedBoard = this.board.filter(
      row => !row.every(value => value > 0)
    );
    const missingRows = Array(currentRows - clearedBoard.length).fill(
      Array(COLS).fill(0)
    );

    this.board = [...missingRows, ...clearedBoard];
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
          this.canvasRenderingContext.fillStyle = COLORS[value];
          this.canvasRenderingContext.fillRect(x, y, 1, 1);
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
      this.drop();
    }

    this.draw();
    requestAnimationFrame(this.animate.bind(this));
  }

  private drop() {
    const movedPiece = this.moves[Keys.DOWN](this.currentPiece);

    if (this.pieceService.isValidMove(movedPiece, this.board)) {
      this.currentPiece.move(movedPiece);
    } else {
      this.freeze();
      this.clearLines();
      this.currentPiece = new PieceObject(this.canvasRenderingContext);
    }
  }

  private draw() {
    // Clear the old position before drawing
    this.canvasRenderingContext.clearRect(
      0,
      0,
      this.canvasRenderingContext.canvas.width,
      this.canvasRenderingContext.canvas.height
    );

    this.currentPiece.draw();
    this.drawBoard();
  }

  private initBoard() {
    // Get the 2D context that we draw on.
    this.canvasRenderingContext = this.canvas.nativeElement.getContext('2d');

    // Calculate size of canvas from constants.
    this.canvasRenderingContext.canvas.width = COLS * BLOCK_SIZE;
    this.canvasRenderingContext.canvas.height = ROWS * BLOCK_SIZE;

    this.canvasRenderingContext.scale(BLOCK_SIZE, BLOCK_SIZE);
  }
}
