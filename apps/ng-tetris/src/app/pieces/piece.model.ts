import { COLS, ROWS, COLORS, SHAPES } from '../config/app.config';

export interface Piece {
  x: number;
  y: number;
  color: string;
  shape: number[][];
}

export class PieceObject implements Piece {
  x: number;
  y: number;
  color: string;
  shape: number[][];

  constructor(private canvasRenderingContext: CanvasRenderingContext2D) {
    this.spawn();
  }

  spawn() {
    const typeId = this.randomizeTetrominoType(COLORS.length - 1);

    this.color = COLORS[typeId];
    this.shape = SHAPES[typeId];

    // Position where the shape spawns.
    this.x = typeId === 4 ? 4 : 3;
    this.y = 0;
  }

  draw() {
    this.canvasRenderingContext.fillStyle = this.color;

    this.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value > 0) {
          // this.x & this.y = position on the board
          // x & y position are the positions of the shape
          this.canvasRenderingContext.fillRect(this.x + x, this.y + y, 1, 1);
        }
      });
    });
  }

  move(movedPiece: Piece) {
    this.x = movedPiece.x;
    this.y = movedPiece.y;
    this.shape = movedPiece.shape;
  }

  private randomizeTetrominoType(noOfTypes: number): number {
    return Math.floor(Math.random() * noOfTypes + 1);
  }
}
