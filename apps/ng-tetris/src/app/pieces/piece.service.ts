import { Injectable } from '@angular/core';

// App Configurations
import { COLS, ROWS } from '../config/app.config';

// App Models
import { Piece } from './piece.model';

@Injectable({ providedIn: 'root' })
export class PieceService {
  isValidMove(movedPiece: Piece, board: number[][]): boolean {
    return movedPiece.shape.every((row, dy) => {
      return row.every((value, dx) => {
        const x = movedPiece.x + dx;
        const y = movedPiece.y + dy;
        return (
          this.isEmpty(value) ||
          (this.insideWalls(x) &&
            this.aboveFloor(y) &&
            this.isFreeOnBoard(board, x, y))
        );
      });
    });
  }

  rotate(piece: Piece): Piece {
    const rotatingPiece: Piece = JSON.parse(JSON.stringify(piece));

    for (let y = 0; y < rotatingPiece.shape.length; ++y) {
      for (let x = 0; x < y; ++x) {
        [rotatingPiece.shape[x][y], rotatingPiece.shape[y][x]] = [
          rotatingPiece.shape[y][x],
          rotatingPiece.shape[x][y]
        ];
      }
    }
    rotatingPiece.shape.forEach(row => row.reverse());

    return rotatingPiece;
  }

  private isEmpty(value: number): boolean {
    return value === 0;
  }

  private insideWalls(x: number): boolean {
    return x >= 0 && x < COLS;
  }

  private aboveFloor(y: number): boolean {
    return y < ROWS;
  }

  private isFreeOnBoard(board: number[][], x, y): boolean {
    return board[y][x] === 0;
  }
}
